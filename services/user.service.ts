import { Types } from "mongoose";
import User, { palette, theme } from "../src/models/User.model.js";
import * as bcrypt from 'bcrypt';
import { HttpError } from "../util/HttpError.js";
import { HttpStatus } from "../util/httpstatus.enum.js";

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
        throw new HttpError('Wrong username or password', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.password);
    
    if (!passwordMatches) {
        throw new HttpError('Wrong username or password', HttpStatus.UNAUTHORIZED);
    }

    return existingUser;
}

async function changePalette(id: string | Types.ObjectId, palette: palette) {
    const user = await User.findByIdAndUpdate(id, { palette }, {
        new: true,
    });

    if (user === null) throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    return user;
}

async function changeTheme(id: string | Types.ObjectId, theme: theme) {
    const user = await User.findByIdAndUpdate(id, { theme }, {
        new: true,
    });
    
    if (user === null) throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    return user;
}

export const userService = {
    findUserByUsername,
    findUserById,
    register,
    login,
    changePalette,
    changeTheme,
};