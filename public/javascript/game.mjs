import {addClass, createElement, removeClass} from './helpers/dom-helper.mjs';
import { showInputModal, showMessageModal } from './views/modal.mjs';
import { appendRoomElement, showRoom, showRoomUI } from './views/room.mjs';
import quitRoomHandler from './modules/quitRoom.js';
import { appendUserElement, changeReadyStatus, setProgress } from './views/user.mjs';
import gameOver from './modules/gameOver.js';

const username = sessionStorage.getItem('username');

if (!username) {
    window.location.replace('/game');
}

const gameSocket = io('/game');

const createRoomBtn = document.getElementById('add-room-btn');

const createRoom = (input) => {
    if (input.length > 0) {
        gameSocket.emit('CREATE_ROOM', {name: input, username: sessionStorage.username})
    }
}

function joinToRoom(data) {
    showRoom();
    quitRoomHandler(gameSocket, data.name);
    const usersWrapper = document.getElementById('users-wrapper');
    usersWrapper.innerHTML = '';

    appendUserElement({ username: sessionStorage.username, ready: false, isCurrentUser: true})

    gameSocket.on('CHANGE_ROOM', (rooms) => {
        usersWrapper.innerHTML = ''
        rooms.filter(roomElem => roomElem.name === data.name)[0].users.forEach((user) => {
            appendUserElement({ username: user.name, ready: user.ready, isCurrentUser: sessionStorage.username === user.name ? true : false})
        })

        const roomTitle = document.getElementById('room-name');
        roomTitle.innerHTML = data.name;
    })
}

function renderRooms(rooms) {
    const roomWrapper = document.getElementById('rooms-wrapper');
    roomWrapper.innerHTML = '';

    rooms.forEach(room => {
        const inviteRoom = () => {
            gameSocket.emit('INVITE_ROOM', {name: room.name, username: sessionStorage.username});
            showRoom();
            quitRoomHandler(gameSocket, room.name)

            gameSocket.on('CHANGE_ROOM', (rooms) => {
                const usersWrapper = document.getElementById('users-wrapper')
                usersWrapper.innerHTML = ''
                rooms.filter(roomElem => roomElem.name === room.name)[0].users.forEach((user) => {
                    appendUserElement({ 
                        username: user.name, 
                        ready: user.ready, 
                        isCurrentUser: sessionStorage.username === user.name ? true : false})
                })

                const roomTitle = document.getElementById('room-name');
                roomTitle.innerHTML = room.name;
            })
        }

        if (room.users.length < 3) {
            appendRoomElement({ name: room.name, numberOfUsers: room.users.length, onJoin: inviteRoom})
        }

        window.addEventListener('beforeunload', () => {
            gameSocket.emit('LEAVE_FROM_GAME', {username: sessionStorage.username, roomName: room.name})
        })
    });
}

createRoomBtn.addEventListener('click', () => showInputModal({title: 'create room', onChange: createRoom}));

gameSocket.on('JOIN_TO_ROOM', joinToRoom)
gameSocket.on('ROOM_EXISTING', () => showMessageModal({ message: 'this room is already exists'}))
gameSocket.on('ROOMS', renderRooms)

const randomIndex = Math.round(Math.random() * 6)

function handleReady(event) {
    if (event.target.innerText === 'READY') {
        gameSocket.emit('CHANGE_READY_STATUS', {readyStatus: true, username: sessionStorage.username});
        event.target.innerText = 'NOT READY'
    } else {
        gameSocket.emit('CHANGE_READY_STATUS', {readyStatus: false, username: sessionStorage.username})
        event.target.innerText = 'READY'
    }
}


let intervalId;

gameSocket.on('CHANGE_HANDLER', (rooms) => {
    const users = document.querySelectorAll('.ready-status');
    const readyUsers = Array.from(users).reduce((amount, user) => {
        if (user.getAttribute('data-ready') === 'true') {
            return amount + 1;
        }
        return amount;
    }, 0);

    if (readyUsers >= 2) {
        gameSocket.emit('GAME_START', { randomIndex });
    }

    gameSocket.on('GET_GAME_PROPS', (props) => {
        addClass(document.querySelector('#quit-room-btn'), 'display-none');
        addClass(document.querySelector('#ready-btn'), 'display-none');
    
        let leaveSeconds = props.firstTimer;
        let firstInterval;
    
        firstInterval = setInterval(() => {
            console.log('timer works');
            if (leaveSeconds > 0) {
                removeClass(document.querySelector('#timer'), 'display-none');
                document.querySelector('#timer').innerHTML = `${leaveSeconds} leave`;
                leaveSeconds -= 1;
            } else {
                addClass(document.querySelector('#timer'), 'display-none');
                removeClass(document.querySelector('#game-timer'), 'display-none');
                clearInterval(firstInterval);
                return;
            }
        }, 1000);
        
        let secondTimer = props.secondTimer;
        
        function gameTimer() {
            console.log('asdsadsadsad');
            if (secondTimer !== 0) {
                secondTimer -= 1;
                document.querySelector('#game-timer-seconds').innerHTML = secondTimer;
            } else {
                gameSocket.emit('TIME_IS_OVER', { roomName: document.querySelector('#room-name').innerText });
                clearInterval(intervalId);
            }
        }
        
        setTimeout(() => {
            removeClass(document.querySelector('#text-container'), 'display-none');
            document.querySelector('#text-container').innerHTML = '';
            
            Array.from(props.text).forEach((char, index) => {
                document.querySelector('#text-container').innerHTML += `<span id='char${index}'>${char}</span>`;
            });
        
            let textCharIndex = 0;
        
            document.addEventListener('keyup', (event) => {
                if (document.querySelector(`#char${textCharIndex}`).innerText.toLowerCase() === event.key) {
                    document.querySelector(`#char${textCharIndex}`).style.background = 'green';
                    document.querySelector(`#char${textCharIndex}`).style.textDecoration = 'none';
                    textCharIndex++;

                    if (textCharIndex < props.text.length) {
                        document.querySelector(`#char${textCharIndex}`).style.textDecoration = 'underline';
                    }
                    
                    gameSocket.emit('TYPE_CHAR', { username: sessionStorage.username, progress: (textCharIndex / props.text.length) * 100, time: secondTimer });
                }
            });
        
            document.querySelector('#game-timer-seconds').innerHTML = secondTimer;
            console.log(document.querySelector('#room-name').innerText);
        
            intervalId = setInterval(gameTimer, 1000);
        }, 1000 * (leaveSeconds + 1));
        
        setTimeout(() => {
            clearInterval(intervalId);
        }, (1000 * ((leaveSeconds + 1000 * props.secondTimer) + 1000)));
    
        gameSocket.on('GAME_OVER', (users) => {
            gameOver(users, intervalId)
        });
    });
});

gameSocket.on('CHANGE_TYPED_CHARS', ({username, progress}) => {
    setProgress({ username: username, progress: progress })
})

gameSocket.on('UPDATE_USERS_STATUS', ({username, roomName}) => {

    const userNameElements = document.querySelectorAll('.username');
    changeReadyStatus({username, ready: false})
    
    userNameElements.forEach((name) => {
        if (name.getAttribute('data-username') === username) {
            name.innerText = (`${username} (leave)`)
        }
    })
})

const readyBtn = document.getElementById('ready-btn');
readyBtn.addEventListener('click', handleReady)