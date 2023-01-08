import { Types } from "mongoose";
import User from "../src/models/User.model.js";
import * as bcrypt from 'bcrypt';

export interface IAuthUser {
    username: string;
    password: string;
}

async function findUserByUsername(username: string) {
    return await User.findOne({ username });
}

async function findUserById(id: Types.ObjectId | string) {
    return await User.findById(id);
}

async function register(user: IAuthUser) {
    const newUser = new User(user);
    await newUser.save();
    return newUser;
}

async function login(user: IAuthUser) {
    const { username, password } = user;
    
    const existingUser = await User.findOne({ username });
    
    if (!existingUser) {
        throw Error('Wrong username or password');
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.password);
    
    if (!passwordMatches) {
        throw Error('Wrong username or password');
    }

    return user;
}

export const userService = {
    findUserByUsername,
    findUserById,
    register,
    login,
};