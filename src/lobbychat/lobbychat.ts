import {IPlugin, IModLoaderAPI, ModLoaderEvents} from 'modloader64_api/IModLoaderAPI';
import {IOOTCore} from 'modloader64_api/OOT/OOTAPI';
import {InjectCore} from 'modloader64_api/CoreInjection';
import { EventHandler, EventsServer, EventServerJoined, EventServerLeft, EventsClient } from 'modloader64_api/EventHandler';
import path from 'path';
import { TunnelMessageHandler, GUITunnelPacket } from 'modloader64_api/GUITunnel';
import { ChatEvents, ChatMessage, ChatStorage, LobbyChat_PingPacket, LobbyChat_HistoryPacket, LobbyChat_AddPlayerPacket, LobbyChat_RmPlayerPacket, LobbyChat_RmMessagePacket, LobbyChat_AddMessagePacket, LobbyChat_JoinEvent } from '@lobbychat/gui/chatclasses';
import { LobbyData, NetworkHandler, INetwork, INetworkPlayer } from 'modloader64_api/NetworkHandler';

class lobbychat implements IPlugin{

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    storage: ChatStorage = new ChatStorage();

    historyReady: boolean = false;
    GUIReady: boolean = false;

    preinit(): void {
    }
    init(): void {
    }
    postinit(): void {
        this.ModLoader.gui.openWindow(400, 600, path.resolve(__dirname, 'gui', 'index.html'));
        let players = this.storage.getPlayers();
        if(players[players.length - 1] !== this.ModLoader.me){
            this.ModLoader.clientSide.sendPacketToSpecificPlayer(new LobbyChat_PingPacket(this.storage.getLobby(), this.ModLoader.me), players[players.length - 1]);
        }
    }
    onTick(frame?: number | undefined): void {
    }

    @EventHandler(EventsClient.ON_LOBBY_JOIN)
    onLobbyJoinClient(evt: LobbyData){
        this.storage.setLobby(evt.name);
        this.storage.addPlayer(this.ModLoader.me);
    }

    @EventHandler(EventsClient.ON_PLAYER_JOIN)
    onPlayerJoin(packet: INetworkPlayer){
        try {
            this.storage.addPlayer(packet);
            try {
                this.ModLoader.gui.tunnel.send('lobbychat:AddPlayer', packet.nickname);
            } catch(err) {
                this.ModLoader.logger.error(err);
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @EventHandler(EventsClient.ON_PLAYER_LEAVE)
    onPlayerLeave(packet: INetworkPlayer){
        try {
            this.storage.removePlayer(packet);
            try {
                this.ModLoader.gui.tunnel.send('lobbychat:RmPlayer', packet.nickname);
            } catch(err) {
                this.ModLoader.logger.error(err);
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @NetworkHandler('LobbyChat_PingPacket')
    onReceivePingPacket(packet: LobbyChat_PingPacket){
        try {
            this.ModLoader.clientSide.sendPacketToSpecificPlayer(new LobbyChat_HistoryPacket(packet.lobby, this.storage.getMessages()), packet.player)
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @NetworkHandler('LobbyChat_HistoryPacket')
    onReceiveHistoryPacket(packet: LobbyChat_HistoryPacket){
        try {
            this.storage.setMessages(packet.history);
            this.historyReady = true;
            if(this.GUIReady){
                this.ModLoader.gui.tunnel.send('lobbychat:JoinUpdate', new LobbyChat_JoinEvent(this.ModLoader.me, this.storage.getLobby(), this.storage.getPlayers(), this.storage.getMessages()));
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @NetworkHandler('LobbyChat_StoragePacket')
    onReceiveStoragePacket(){
        this.ModLoader.logger.error("Somebody needs an update...");
        this.historyReady = true;
    }

    @NetworkHandler('LobbyChat_AddMessagePacket')
    onReceiveAddMessagePacket(packet: LobbyChat_AddMessagePacket){
        try {
            this.storage.addMessage(packet.message);
            try {
                this.ModLoader.gui.tunnel.send('lobbychat:AddMsg', packet.message);
            } catch(err) {
                this.ModLoader.logger.error(err);
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @NetworkHandler('LobbyChat_RmMessagePacket')
    onReceiveRmMessagePacket(packet: LobbyChat_RmMessagePacket){
        try {
            this.storage.removeMessage(packet.message);
            try {
                this.ModLoader.gui.tunnel.send('lobbychat:RmMessage', packet.message);
            } catch(err) {
                this.ModLoader.logger.error(err);
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }

    @TunnelMessageHandler('lobbychat:GUIReady')
    onGUIReady(){
        this.GUIReady = true;
        if(this.storage.getPlayers().length <= 1){
            this.historyReady = true;
        }
        if(this.historyReady){
            this.ModLoader.gui.tunnel.send('lobbychat:JoinUpdate', new LobbyChat_JoinEvent(this.ModLoader.me, this.storage.getLobby(), this.storage.getPlayers(), this.storage.getMessages()));
        }
    }

    @TunnelMessageHandler('lobbychat:SendMessage')
    onSendMessage(evt: any){
        try {
            this.storage.addMessage(evt.value);
            this.ModLoader.clientSide.sendPacket(new LobbyChat_AddMessagePacket(this.storage.getLobby(), evt.value));
            try {
                this.ModLoader.gui.tunnel.send('lobbychat:AddMsg', evt.value);
            } catch(err) {
                this.ModLoader.logger.error(err);
            }
        } catch(err) {
            this.ModLoader.logger.error(err);
        }
    }
}

module.exports = lobbychat;