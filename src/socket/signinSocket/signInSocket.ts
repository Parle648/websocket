import { users } from '../../data.js'

export default function signInScoket(io) {
    io.on('connect', socket => {
        socket.emit('PUSH_USER', users)
        
        const isUserExist = (users: string[], username: string) => {
            if (users.some((user: string) => user === username)) {
                return true;
            }
            return false
        }
        
        socket.on('CREATE_USER', ({username}: {username: string}) => {
            console.log(username, isUserExist(users, username));
            
            if (isUserExist(users, username)) {
                socket.emit('USER_EXIST')
            } else {
                users.push(username);
                console.log(users);
                socket.emit('PUSH_USER', users)
                socket.broadcast.emit('PUSH_USER', users)
            }
        })

        socket.on('disconect', () => {

        })
    })
}