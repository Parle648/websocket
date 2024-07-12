import { createElement } from '../helpers/dom-helper.mjs';
import { addClass, removeClass } from '../helpers/dom-helper.mjs';

const appendRoomElement = ({ name, numberOfUsers, onJoin = () => {} }) => {
    const roomsContainer = document.querySelector('#rooms-wrapper');

    const nameElement = createElement({
        tagName: 'div',
        className: 'room-name',
        attributes: { 'data-room-name': name },
        innerElements: [name]
    });

    const numberOfUsersString = getNumberOfUsersString(numberOfUsers);
    const connectedUsersElement = createElement({
        tagName: 'div',
        className: 'connected-users',
        attributes: { 'data-room-name': name, 'data-room-number-of-users': numberOfUsers },
        innerElements: [numberOfUsersString]
    });

    const joinButton = createElement({
        tagName: 'button',
        className: 'join-btn',
        attributes: { 'data-room-name': name },
        innerElements: ['Join']
    });

    const roomElement = createElement({
        tagName: 'div',
        className: 'room',
        attributes: { 'data-room-name': name },
        innerElements: [nameElement, connectedUsersElement, joinButton]
    });

    roomsContainer.append(roomElement);

    joinButton.addEventListener('click', onJoin);

    return roomElement;
};

const updateNumberOfUsersInRoom = ({ name, numberOfUsers }) => {
    const roomConnectedUsersElement = document.querySelector(`.connected-users[data-room-name='${name}']`);
    roomConnectedUsersElement.innerText = getNumberOfUsersString(numberOfUsers);
    roomConnectedUsersElement.dataset.roomNumberOfUsers = numberOfUsers;
};

const getNumberOfUsersString = numberOfUsers => `${numberOfUsers} connected`;

const removeRoomElement = name => document.querySelector(`.room[data-room-name='${name}']`)?.remove();

function showRoom() {
    const roomsPage = document.getElementById('rooms-page');
    const gamePage = document.getElementById('game-page');
    addClass(roomsPage, 'display-none')
    removeClass(gamePage, 'display-none')
}
function closeRoom() {
    const roomsPage = document.getElementById('rooms-page');
    const gamePage = document.getElementById('game-page');
    addClass(gamePage, 'display-none')
    removeClass(roomsPage, 'display-none')
}

function showRoomUI() {
    removeClass(document.querySelector('#quit-room-btn'), 'display-none')
    removeClass(document.querySelector('#ready-btn'), 'display-none')
    document.querySelector('#ready-btn').innerText = 'READY'
    
    addClass(document.querySelector('#text-container'), 'display-none')
    addClass(document.querySelector('#game-timer'), 'display-none')
}

export { appendRoomElement, updateNumberOfUsersInRoom, removeRoomElement, showRoom, closeRoom, showRoomUI };
