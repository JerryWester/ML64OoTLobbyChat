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
    history: Array<IChatMessage>;
    constructor(player: INetworkPlayer, lobby: string, players: Array<INetworkPlayer>, history: Array<IChatMessage>){
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

export class LobbyChat_HistoryPacket extends Packet{
    history: Array<IChatMessage>;
    constructor(lobby: string, history: Array<IChatMessage>) {
        super('LobbyChat_HistoryPacket', 'LobbyChat', lobby, false);
        this.history = history;
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
    message: IChatMessage;

    constructor(lobby: string, message: IChatMessage) {
        super('LobbyChat_AddMessagePacket', 'LobbyChat', lobby, true);
        this.message = message;
    }
}

export class LobbyChat_RmMessagePacket extends Packet{
    message: IChatMessage;

    constructor(lobby: string, message: IChatMessage) {
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

export interface IChatMessage {
    sender: string;
    message: string;
}

export class ChatMessage implements IChatMessage {
    sender: string;
    message: string;
    constructor(sender: string, message: string){
        this.sender = sender;
        this.message = message;
    }
}

export interface IChatStorage {
    lobby: string;
    players: Array<INetworkPlayer>;
    history: Array<IChatMessage>;
    getLobby(): string;
    setLobby(lobby: string): void;
    addPlayer(player: INetworkPlayer): void;
    removePlayer(player: INetworkPlayer): void;
    getPlayers(): Array<INetworkPlayer>;
    sendMessage(name: string, message: string): void;
    addMessage(message: IChatMessage): void;
    removeMessage(message: IChatMessage): void;
    getMessages(): Array<IChatMessage>;
    setMessages(history: Array<IChatMessage>): void;
}

export class ChatStorage implements IChatStorage{
    lobby: string;
    players: Array<INetworkPlayer>;
    history: Array<IChatMessage>;
    constructor(lobby?: string){
        this.lobby = typeof lobby === 'string' ? lobby : '';
        this.players = [];
        this.history = [];
    }

    static getLobby(object: IChatStorage){
        return object.lobby;
    }

    getLobby(): string{
        return ChatStorage.getLobby(this);
    }

    static setLobby(object: IChatStorage, lobby: string){
        object.lobby = lobby;
    }

    setLobby(lobby: string){
        ChatStorage.setLobby(this, lobby);
    }

    static addPlayer(object: IChatStorage, player: INetworkPlayer){
        object.players.push(player);
        bus.emit(ChatEvents.ADD_PLAYER, player);
        NetworkBus.emit(ChatEvents.ADD_PLAYER, player);
    }

    addPlayer(player: INetworkPlayer){
        ChatStorage.addPlayer(this, player);
    }

    static removePlayer(object: IChatStorage, player: INetworkPlayer){
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

    static getPlayers(object: IChatStorage){
        return object.players;
    }

    getPlayers(): Array<INetworkPlayer>{
        return ChatStorage.getPlayers(this);
    }

    static sendMessage(object: IChatStorage, name: string, message: string){
        ChatStorage.addMessage(object, new ChatMessage(name, message));
    }

    sendMessage(name: string, message: string){
        ChatStorage.sendMessage(this, name, message);
    }

    static addMessage(object: IChatStorage, message: IChatMessage){
        object.history.push(message);
        bus.emit(ChatEvents.ADD_MSG, message);
        NetworkBus.emit(ChatEvents.ADD_MSG, message);
    }

    addMessage(message: IChatMessage){
        ChatStorage.addMessage(this, message);
    }

    static removeMessage(object: IChatStorage, message: IChatMessage){
        let rmdMsg: IChatMessage;
        try {
            rmdMsg = object.history.splice(object.history.indexOf(message))[0];
            bus.emit(ChatEvents.RM_MSG, rmdMsg);
            NetworkBus.emit(ChatEvents.RM_MSG, rmdMsg);
        } catch(err) {
            ChatStorage.sendMessage(object, "ERR", err);
        }
    }

    removeMessage(message: IChatMessage){
        ChatStorage.removeMessage(this, message);
    }

    static getMessages(object: IChatStorage){
        return object.history;
    }

    getMessages(): Array<IChatMessage>{
        return ChatStorage.getMessages(this);
    }

    static setMessages(object: IChatStorage, history: Array<IChatMessage>){
        object.history = JSON.parse(JSON.stringify(history)) as Array<IChatMessage>;
    }

    setMessages(history: Array<IChatMessage>){
        ChatStorage.setMessages(this, history);
    }
}