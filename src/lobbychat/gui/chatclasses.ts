import { bus } from "modloader64_api/EventHandler";
import { NetworkBus, IPacketHeader, INetworkPlayer, SocketType } from "modloader64_api/NetworkHandler";
import { Packet } from "modloader64_api/ModLoaderDefaultImpls"

export enum ChatEvents{
    ADD_MSG = "lobbychat_addmsg",
    RM_MSG = "lobbychat_rmmsg",
    ADD_PLAYER = "lobbychat_addplayer",
    RM_PLAYER = "lobbychat_rmplayer",
}

export class LobbyChat_JoinEvent{
    player: INetworkPlayer;
    lobby: string;
    players: Array<INetworkPlayer>;
    history: Array<ChatMessage>;
    constructor(player: INetworkPlayer, lobby: string, players: Array<INetworkPlayer>, history: Array<ChatMessage>){
        this.player = player;
        this.lobby = lobby;
        this.players = players;
        this.history = history;
    }
}

export class LobbyChat_PingPacket extends Packet{
    constructor(lobby: string, player: INetworkPlayer) {
        super('LobbyChat_PingPacket', 'LobbyChat', lobby, true);
        this.player = player;
    }
}

export class LobbyChat_StoragePacket extends Packet{
    storage: ChatStorage;
    constructor(lobby: string, storage: ChatStorage) {
        super('LobbyChat_StoragePacket', 'LobbyChat', lobby, false);
        this.storage = storage;
    }
}

export class LobbyChat_AddPlayerPacket extends Packet{
    constructor(lobby: string, player: INetworkPlayer) {
        super('LobbyChat_AddPlayerPacket', 'LobbyChat', lobby, true);
        this.player = player;
    }
}

export class LobbyChat_RmPlayerPacket extends Packet{
    constructor(lobby: string, player: INetworkPlayer) {
        super('LobbyChat_RmPlayerPacket', 'LobbyChat', lobby, true);
        this.player = player;
    }
}

export class LobbyChat_AddMessagePacket extends Packet{
    message: ChatMessage;

    constructor(lobby: string, message: ChatMessage) {
        super('LobbyChat_AddMessagePacket', 'LobbyChat', lobby, true);
        this.message = message;
    }
}

export class LobbyChat_RmMessagePacket extends Packet{
    message: ChatMessage;

    constructor(lobby: string, message: ChatMessage) {
        super('LobbyChat_RmMessagePacket', 'LobbyChat', lobby, true);
        this.message = message;
    }
}

// export class HTMLMessageElement extends HTMLParagraphElement{
//     messageObject?: ChatMessage;

//     constructor(){
//         super()
//     }
// }

export class ChatMessage{
    sender: string;
    message: string;
    constructor(sender: string, message: string){
        this.sender = sender;
        this.message = message;
    }
}

export class ChatStorage{
    lobby: string;
    players: Array<INetworkPlayer>;
    history: Array<ChatMessage>;
    constructor(lobby?: string){
        this.lobby = typeof lobby === 'string' ? lobby : '';
        this.players = [];
        this.history = [];
    }

    static getLobby(object: ChatStorage){
        return object.lobby;
    }

    getLobby(){
        return ChatStorage.getLobby(this);
    }

    static setLobby(object: ChatStorage, lobby: string){
        object.lobby = lobby;
    }

    setLobby(lobby: string){
        ChatStorage.setLobby(this, lobby);
    }

    static addPlayer(object: ChatStorage, player: INetworkPlayer){
        object.players.push(player);
        bus.emit(ChatEvents.ADD_PLAYER, player);
        NetworkBus.emit(ChatEvents.ADD_PLAYER, player);
    }

    addPlayer(player: INetworkPlayer){
        ChatStorage.addPlayer(this, player);
    }

    static removePlayer(object: ChatStorage, player: INetworkPlayer){
        try {
            object.players.splice(object.players.indexOf(player));
            bus.emit(ChatEvents.RM_PLAYER, player);
            NetworkBus.emit(ChatEvents.RM_PLAYER, player);
        } catch(err) {
            ChatStorage.sendMessage(object, "ERR", err);
        }
    }

    removePlayer(player: INetworkPlayer){
        ChatStorage.removePlayer(this, player);
    }

    static getPlayers(object: ChatStorage){
        return object.players;
    }

    getPlayers(){
        return ChatStorage.getPlayers(this);
    }

    static sendMessage(object: ChatStorage, name: string, message: string){
        ChatStorage.addMessage(object, new ChatMessage(name, message));
    }

    sendMessage(name: string, message: string){
        ChatStorage.sendMessage(this, name, message);
    }

    static addMessage(object: ChatStorage, message: ChatMessage){
        object.history.push(message);
        bus.emit(ChatEvents.ADD_MSG, message);
        NetworkBus.emit(ChatEvents.ADD_MSG, message);
    }

    addMessage(message: ChatMessage){
        ChatStorage.addMessage(this, message);
    }

    static removeMessage(object: ChatStorage, message: ChatMessage){
        let rmdMsg: ChatMessage;
        try {
            rmdMsg = object.history.splice(object.history.indexOf(message))[0];
            bus.emit(ChatEvents.RM_MSG, rmdMsg);
            NetworkBus.emit(ChatEvents.RM_MSG, rmdMsg);
        } catch(err) {
            ChatStorage.sendMessage(object, "ERR", err);
        }
    }

    removeMessage(message: ChatMessage){
        ChatStorage.removeMessage(this, message);
    }

    static getMessages(object: ChatStorage){
        return object.history;
    }

    getMessages(){
        return ChatStorage.getMessages(this);
    }
}