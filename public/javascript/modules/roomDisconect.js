import { Socket } from "socket.io";
import { addClass, removeClass } from "../helpers/dom-helper.mjs";

export default function roomDisconect() {
    const gamePage = document.getElementById('rooms-page');
    const roomsPage = document.getElementById('rooms-page');
    
    socket.emit('disconect', {username: sessionStorage.username, roomName: roomName})
    addClass(gamePage, 'display-none')
    removeClass(roomsPage, 'display-none')
}