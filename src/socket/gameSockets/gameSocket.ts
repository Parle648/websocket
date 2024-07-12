import { rooms, texts, users } from '../../data.js'
import IRoom from '../../types/room.js';
import { IUser } from '../../types/user.js';
import { SECONDS_FOR_GAME, SECONDS_TIMER_BEFORE_START_GAME } from '../config.js';

export default function gameSocket(io) {
    io.on('connect', socket => {
        socket.emit('ROOMS', rooms);

        socket.on('CREATE_ROOM', ({name, username}: {name: string, username: string}) => {
            if (rooms.some((room : IRoom) => room.name === name)) {
                socket.emit('ROOM_EXISTING')
            } else {
                rooms.push({name, users: [{name: username, ready: false, progres: 0, time: 1}]})
                socket.emit('ROOMS', rooms);
                socket.broadcast.emit('ROOMS', rooms);

                socket.join(name);
                io.to(socket.id).emit('JOIN_TO_ROOM', {name, users: [{name: username, ready: false, progres: 0, time: 1}]})
            }
        })

        socket.on('INVITE_ROOM', ({name, username}: {name: string, username: string}) => {
            if (rooms.some((room: IRoom) => room.name === name && room.users.length < 3)) {
                rooms.forEach((room) => {
                    if (room.name === name) {
                        room.users.push({name: username, ready: false, progres: 0, time: 1})
                        return room
                    }
                    return room
                })
                socket.broadcast.emit('CHANGE_ROOM', rooms);
                socket.emit('CHANGE_ROOM', rooms);

                socket.emit('ROOMS', rooms);
                socket.broadcast.emit('ROOMS', rooms);

                socket.join(name);
            } else {
                console.log('this room already has 3 people');
            }
        })

        socket.on('CHANGE_READY_STATUS', ({readyStatus, username}: {readyStatus: boolean, username: string}) => {
            const roomIndex = rooms.findIndex((room: IRoom) => room.users.some((user: IUser) => user.name === username));
            rooms[roomIndex].users.filter((user: IUser) => {
                if (user.name === username) {
                    user.ready = readyStatus;
                    return user
                }
            })

            socket.emit('CHANGE_ROOM', rooms)
            socket.broadcast.emit('CHANGE_ROOM', rooms)
            
            socket.emit('CHANGE_HANDLER', rooms)
        })

        socket.on('GAME_START', ({randomIndex}: {randomIndex: number}) => {
            const randomText = texts[randomIndex];
            socket.emit('GET_GAME_PROPS', {
                text: randomText,
                firstTimer: SECONDS_TIMER_BEFORE_START_GAME,
                secondTimer: SECONDS_FOR_GAME
            })
            socket.broadcast.emit('GET_GAME_PROPS', {
                text: randomText,
                firstTimer: SECONDS_TIMER_BEFORE_START_GAME,
                secondTimer: SECONDS_FOR_GAME
            })
        })

        socket.on('TYPE_CHAR', ({username, progress, time}: {username: string, progress: number, time: number}) => {
            const roomIndex = rooms.findIndex((room: IRoom) => room.users.some((user: IUser) => user.name === username));
            rooms[roomIndex].users.filter((user: IUser) => {
                if (user.name === username) {
                    user.progres = progress;
                }
                return user
            })

            if (progress === 100) {
                rooms[roomIndex].users.filter((user: IUser) => {
                    if (user.name === username) {
                        user.progres = progress;
                        user.time = time
                    }
                    return user
                })
            }

            socket.emit('CHANGE_TYPED_CHARS', {progress, username})
            socket.broadcast.emit('CHANGE_TYPED_CHARS', {progress, username})

            if (rooms[roomIndex].users.every((user: IUser) => user.progres === 100)) {
                const sortedUsersByWining = JSON.parse(JSON.stringify(rooms[roomIndex].users));

                console.log(sortedUsersByWining)

                sortedUsersByWining.sort((a, b) => {
                    return b.time*b.progres - a.time*a.progres
                })
                socket.emit('GAME_OVER', {sortedUsersByWining: sortedUsersByWining.sort((a, b) => {
                    return b.time*b.progres - a.time*a.progres
                })})
                socket.broadcast.emit('GAME_OVER', {sortedUsersByWining: sortedUsersByWining.sort((a, b) => {
                    return b.time*b.progres - a.time*a.progres
                })})

                rooms[roomIndex].users.forEach((user: IUser) => {
                    user.ready = false;
                    user.time = 0

                    return user
                })
            }
        })

        socket.on('TIME_IS_OVER', ({roomName}: {roomName: string}) => {
            const roomIndex = rooms.findIndex((room: IRoom) => room.name === roomName);
            const sortedUsersByWining = JSON.parse(JSON.stringify(rooms[roomIndex].users));

            sortedUsersByWining.sort((a, b) => {
                return b.time*b.progres - a.time*a.progres
            })

            rooms[roomIndex].users.forEach((user: IUser) => {
                user.ready = false;
                return user
            });

            socket.emit('GAME_OVER', {sortedUsersByWining: sortedUsersByWining.sort((a, b) => {
                return b.time*b.progres - a.time*a.progres
            })})

            socket.emit('CHANGE_ROOM', rooms)
            socket.broadcast.emit('CHANGE_ROOM', rooms)
        })

        socket.on('LEAVE_FROM_GAME', ({username, roomName}: {username: string, roomName: string}) => {
            rooms.filter((room, index) => {
                if (room.users.some((user: IUser) => user.name === username)) {
                    room.users.forEach((user: IUser, index: number) => {
                        if (user.name === username) {
                            room.users.splice(index, index + 1)
                        }
                    })
                    if (room.users.length === 0) {
                        rooms.splice(index, index + 1)
                    };
                }

            })

            const userIndex = users.indexOf(username);
            users.splice(userIndex, userIndex + 1)
            console.log(users);
            
            socket.broadcast.emit('UPDATE_USERS_STATUS', {username: username, roomName: roomName})

            socket.emit('ROOMS', rooms)
            socket.broadcast.emit('ROOMS', rooms)
//
            const roomIndex = rooms.findIndex((room: IRoom) => room.name === roomName);
            
            if (rooms[roomIndex] && rooms[roomIndex].users.every((user: IUser) => user.progres === 100)) {
                const sortedUsersByWining = JSON.parse(JSON.stringify(rooms[roomIndex].users));
    
                sortedUsersByWining.sort((a, b) => {
                    return b.time*b.progres - a.time*a.progres
                })
    
                rooms[roomIndex].users.forEach((user: IUser) => {
                    user.ready = false;
                    user.time = 0
                    return user
                });
    
                socket.broadcast.emit('GAME_OVER', {sortedUsersByWining: sortedUsersByWining.sort((a, b) => {
                    return b.time*b.progres - a.time*a.progres
                })})

            }
            socket.leave(roomName)

        })

        socket.on('disconect', ({username, roomName}: {username: string, roomName: string}) => {
            rooms.filter((room, index) => {
                if (room.users.some((user: IUser) => user.name === username)) {
                    room.users.forEach((user, index) => {
                        if (user.name === username) {
                            room.users.splice(index, index + 1)
                        }
                    })
                    if (room.users.length === 0) {
                        rooms.splice(index, index + 1)
                    };
                }

            })

            const userIndex = users.indexOf(username);
            users.splice(userIndex, userIndex + 1)
            console.log(users);

            socket.emit('CHANGE_ROOM', rooms);
            socket.broadcast.emit('CHANGE_ROOM', rooms);

            socket.emit('ROOMS', rooms);
            socket.broadcast.emit('ROOMS', rooms);

            socket.leave(roomName)
        })
    })
}