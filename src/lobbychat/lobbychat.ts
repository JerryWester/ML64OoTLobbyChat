import {IPlugin, IModLoaderAPI, ModLoaderEvents} from 'modloader64_api/IModLoaderAPI';
import {IOOTCore} from 'modloader64_api/OOT/OOTAPI';
import {InjectCore} from 'modloader64_api/CoreInjection';
import { EventHandler, EventsServer, EventServerJoined, EventServerLeft, EventsClient } from 'modloader64_api/EventHandler';
import path from 'path';
import { TunnelMessageHandler, GUITunnelPacket } from 'modloader64_api/GUITunnel';
import { ChatEvents, ChatMessage, ChatStorage, LobbyChat_PingPacket, LobbyChat_StoragePacket, LobbyChat_AddPlayerPacket, LobbyChat_RmPlayerPacket, LobbyChat_RmMessagePacket, LobbyChat_AddMessagePacket, LobbyChat_JoinEvent } from '@lobbychat/gui/chatclasses';
import { LobbyData, NetworkHandler, INetwork, INetworkPlayer } from 'modloader64_api/NetworkHandler';

class lobbychat implements IPlugin{

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    storage: ChatStorage = new ChatStorage();

    preinit(): void {
    }
    init(): void {
    }
    postinit(): void {
        this.ModLoader.gui.openWindow(400, 600, path.resolve(__dirname, 'gui', 'index.html'));
    }
    onTick(frame?: number | undefined): void {
    }

    @EventHandler(EventsClient.ON_LOBBY_JOIN)
    onLobbyJoinClient(evt: LobbyData){
        ChatStorage.setLobby(this.storage, evt.name);
        ChatStorage.addPlayer(this.storage, this.ModLoader.me);
        this.ModLoader.clientSide.sendPacket(new LobbyChat_PingPacket(evt.name, this.ModLoader.me));
    }

    @NetworkHandler('LobbyChat_PingPacket')
    onReceivePingPacket(packet: LobbyChat_PingPacket){
        this.ModLoader.clientSide.sendPacketToSpecificPlayer(new LobbyChat_StoragePacket(packet.lobby, this.storage), packet.player);
    }

    @NetworkHandler('LobbyChat_StoragePacket')
    onReceiveStoragePacket(packet: LobbyChat_StoragePacket){
        this.storage = packet.storage;
        // ChatStorage.addPlayer(this.storage, this.ModLoader.me);
        this.ModLoader.clientSide.sendPacket(new LobbyChat_AddPlayerPacket(packet.lobby, this.ModLoader.me));
    }

    @EventHandler(EventsClient.ON_PLAYER_JOIN)
    onPlayerJoin(packet: INetworkPlayer){
        try {
            let addPlayer: boolean = true;
            ChatStorage.getPlayers(this.storage).forEach((player: INetworkPlayer) => {
                if(packet.nickname === player.nickname){
                    addPlayer = false;
                }
            });
            if(addPlayer){
                ChatStorage.addPlayer(this.storage, packet);
                try {this.ModLoader.gui.tunnel.send('lobbychat:AddPlayer', packet.nickname);} catch(err) {}
            }
        } catch(err) {}
    }

    // @NetworkHandler('LobbyChat_AddPlayerPacket')
    // onReceiveAddPlayerPacket(packet: LobbyChat_AddPlayerPacket){
    //     this.storage.addPlayer(packet.player);
    //     this.ModLoader.gui.tunnel.send('lobbychat:AddPlayer', packet.player.nickname);
    // }

    @EventHandler(EventsClient.ON_PLAYER_LEAVE)
    onPlayerLeave(packet: INetworkPlayer){
        ChatStorage.getPlayers(this.storage).forEach((player: INetworkPlayer) => {
            if(packet.nickname === player.nickname){
                ChatStorage.removePlayer(this.storage, packet);
                try {this.ModLoader.gui.tunnel.send('lobbychat:RmPlayer', packet.nickname);} catch(err) {}
            }
        });
    }

    // @NetworkHandler('LobbyChat_RmPlayerPacket')
    // onReceiveRmPlayerPacket(packet: LobbyChat_RmPlayerPacket){
    //     this.storage.removePlayer(packet.player);
    //     this.ModLoader.gui.tunnel.send('lobbychat:RmPlayer', packet.player.nickname);
    // }

    @NetworkHandler('LobbyChat_AddMessagePacket')
    onReceiveAddMessagePacket(packet: LobbyChat_AddMessagePacket){
        ChatStorage.addMessage(this.storage, packet.message);
        try {this.ModLoader.gui.tunnel.send('lobbychat:AddMsg', packet.message);} catch(err) {}
    }

    @NetworkHandler('LobbyChat_RmMessagePacket')
    onReceiveRmMessagePacket(packet: LobbyChat_RmMessagePacket){
        ChatStorage.removeMessage(this.storage, packet.message);
        try {this.ModLoader.gui.tunnel.send('lobbychat:RmMsg', packet.message);} catch(err) {}
    }

    @TunnelMessageHandler('lobbychat:GUIReady')
    onGUIReady(){
        this.ModLoader.gui.tunnel.send('lobbychat:JoinUpdate', new LobbyChat_JoinEvent(this.ModLoader.me, this.storage));
    }

    @TunnelMessageHandler('lobbychat:SendMessage')
    onSendMessage(evt: any){
        ChatStorage.addMessage(this.storage, evt.value);
        this.ModLoader.clientSide.sendPacket(new LobbyChat_AddMessagePacket(ChatStorage.getLobby(this.storage), evt.value));
        this.ModLoader.gui.tunnel.send('lobbychat:AddMsg', evt.value);
    }
}

module.exports = lobbychat;