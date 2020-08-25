import { MessageLayer } from 'modloader64_api/MessageLayer';
import { TunnelMessageHandler } from 'modloader64_api/GUITunnel';
import { ChatMessage, ChatStorage, LobbyChat_JoinEvent } from './chatclasses';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const stripHtml = require('./string-strip-html.umd.js');

const hooks = {};
// let storage: ChatStorage = new ChatStorage();
let player: string = "";

class MapMessageHandlers {
    tunnel!: MessageLayer;

    constructor(){
        this.tunnel = new MessageLayer('cheatmenu', ipc, ipc);
        this.tunnel.setupMessageProcessor(this);
    }

    @TunnelMessageHandler("lobbychat:JoinUpdate")
    onJoined(evt: LobbyChat_JoinEvent){
        let header = document.getElementById('header') as HTMLDivElement;
        header.innerHTML = `<h2>${evt.storage.lobby}</h2>`;
        player = evt.player.nickname;
        // announce('Retreiving Old Messages...');
        ChatStorage.getMessages(evt.storage).forEach(addMessage);
        // announce('Getting Lobby...');
        announce(`You have joined lobby ${ChatStorage.getLobby(evt.storage)}!`);
        // announce('Getting Players...')
        let names: Array<string> = [];
        ChatStorage.getPlayers(evt.storage).forEach((player) => {
            names.push(player.nickname);
        });
        announce(`There is currently ${names.length} players in the lobby: ${names.join(', ')}`);
    }

    @TunnelMessageHandler("lobbychat:AddMsg")
    onMsgAdd(evt: ChatMessage){
        addMessage(evt);
    }

    @TunnelMessageHandler("lobbychat:RmMsg")
    onMsgRm(evt: ChatMessage){
        // TODO
    }

    @TunnelMessageHandler("lobbychat:AddPlayer")
    onPlayerAdd(evt: string){
        announce(`Player ${evt} has joined the lobby! Welcome!`)
    }

    @TunnelMessageHandler("lobbychat:RmPlayer")
    onPlayerRm(evt: string){
        announce(`Player ${evt} has left the lobby! Goodbye!`)
    }
}

const handlers = new MapMessageHandlers();

let msgarea = document.getElementById('msgarea') as HTMLDivElement;

function addMessage(msg: ChatMessage){
    let message = document.createElement('p') as HTMLParagraphElement;
    message.className = 'message';
    message.innerHTML = `<b>${msg.sender}</b><br>${msg.message}`;
    // message.messageObject = msg;
    msgarea.append(message);
    message.scrollIntoView();
}

function announce(msg: string){
    let message = document.createElement('p');
    message.className = 'announcement';
    message.innerHTML = msg;
    msgarea.append(message);
    message.scrollIntoView()
}

let upload = document.getElementById('upload') as HTMLInputElement;

function uploadImage(file: File){
    let src: string = URL.createObjectURL(file);
    handlers.tunnel.send("forwardToML", {id: "lobbychat:SendMessage", value: new ChatMessage(player, `<img src="${src}" onload="URL.revokeObjectURL(${src})" max-width="100%"></img>`)});
}

upload.addEventListener('input', () => {
    if(upload.files !== null){
        uploadImage(upload.files[0]);
    }
})

document.addEventListener('paste', (evt) => {
    if(evt.clipboardData !== null){
        if(evt.clipboardData.files.length > 0){
            if(/image\/.+/g.test(evt.clipboardData.files[0].type)){
                uploadImage(evt.clipboardData.files[0]);
            }
        }
    }
});

document.addEventListener('dragover', (evt) => {
    evt.preventDefault();
});

document.addEventListener('drop', (evt) => {
    evt.preventDefault();
    if(evt.dataTransfer !== null){
        if(evt.dataTransfer.files.length > 0){
            if(/image\/.+/g.test(evt.dataTransfer.files[0].type)){
                uploadImage(evt.dataTransfer.files[0]);
            }
        }
    }
});

let text = document.getElementById('text') as HTMLTextAreaElement;
text.value = '';

text.addEventListener('keydown', (evt) => {
    if(evt.key === 'Enter' && !evt.shiftKey){
        evt.preventDefault();
        if(text.value !== ''){
            handlers.tunnel.send("forwardToML", {id: "lobbychat:SendMessage", value: new ChatMessage(player, stripHtml(text.value).result)});
            text.value = '';
        }
    }
});

window.addEventListener('load', () => {
    handlers.tunnel.send("forwardToML", {id: "lobbychat:GUIReady"});
});