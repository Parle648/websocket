import { createElement } from './helpers/dom-helper.mjs'

const username = sessionStorage.getItem('username');
const signInPage = document.getElementById('signin-page');
const closeModalElement = createElement({ tagName: 'button', className: 'close-btn', innerElements: ['X'] })
const errorModalElement = createElement({ tagName: 'div', className: 'modal display-none', innerElements: [closeModalElement] });

signInPage.append(errorModalElement)

const errorModal = document.querySelector('.modal');
errorModal.append(closeModalElement)

const signInSocket = io('/signin');

if (username) {
    window.location.replace('/game');
}

const submitButton = document.getElementById('submit-button');
const input = document.getElementById('username-input');

const getInputValue = () => input.value;

const onClickSubmitButton = () => {
    const inputValue = getInputValue();
    if (!inputValue) {
        return;
    }
    signInSocket.emit('CREATE_USER', {username: inputValue})
    
    signInSocket.on('PUSH_USER', () => {
        sessionStorage.setItem('username', inputValue);
        window.location.replace('/game');
    })
    
    signInSocket.on('USER_EXIST', () => {
        errorModal.classList.remove('display-none')
        errorModal.innerHTML += `user ${inputValue} is already exist change your name please`

        const closeModal = document.querySelector('.close-btn');

        closeModal.addEventListener('click', (event) => {
            errorModal.classList.add('display-none')
        })
    })
};

const onKeyUp = ev => {
    const enterKeyCode = 13;
    if (ev.keyCode === enterKeyCode) {
        submitButton.click();
    }
};

submitButton.addEventListener('click', onClickSubmitButton);
window.addEventListener('keyup', onKeyUp);
