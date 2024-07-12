import { closeRoom } from "../views/room.mjs";

export default function quitRoomHandler(gameSocket, roomName) {
    const quitBtn = document.getElementById('quit-room-btn');
    quitBtn.addEventListener('click', () => {
        gameSocket.emit('disconect', {username: sessionStorage.username, roomName: roomName})
        closeRoom();
    })
}