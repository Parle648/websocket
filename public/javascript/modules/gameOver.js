import { showMessageModal } from "../views/modal.mjs";
import { showRoomUI } from "../views/room.mjs";
import { changeReadyStatus } from "../views/user.mjs";

export default function gameOver(users, intervalId) {
    clearInterval(intervalId);
    let position = 1;
    let message = '';

    Object.values(users)[0].forEach((user) => {
        message += `${position} - ${user.name} \n`;
        position += 1;
        changeReadyStatus({username: user.name, ready: false})
    });

    showMessageModal({ message: message });
    showRoomUI();

    document.querySelectorAll('.ready-status').forEach(status => {
        status.setAttribute('data-ready', 'false');
    });

    document.querySelectorAll('.user-progress').forEach(bar => {
        bar.style.width = '0%';
    });
}