import { IUser } from "./user.js";

export default interface IRoom {
    name: string, 
    users: IUser[]
}