import { Types } from "mongoose";
import User, { palette, theme } from "../src/models/User.model.js";
import * as bcrypt from 'bcrypt';
import { HttpError } from "../util/HttpError.js";
import { HttpStatus } from "../util/httpstatus.enum.js";

/**
 * ```typescript
 * interface IAuthUser {
    username: string;
    password: string;
}
 * ```
 */
export interface IAuthUser {
    username: string;
    password: string;
}

/**
 * Returns the user that has the corresponding username.
 */
async function findUserByUsername(username: string) {
    return await User.findOne({ username });
}

/**
 * Returns the user with the corresponding ``_id``.
 */
async function findUserById(id: Types.ObjectId | string) {
    return await User.findById(id);
}

/**
 * Creates a user in the database and returns them.
 */
async function register(user: IAuthUser) {
    const newUser = new User(user);
    await newUser.save();
    return newUser;
}

/**
 * Returns a User object if the provided password matches the user's password or throws an error
 * for wrong password or non-existant user.
 */
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

/**
 * Changes the ``palette`` property of the user with the given ``_id`` and returns the updated user.
 * This function throws an error if the user does not exist.
 */
async function changePalette(id: string | Types.ObjectId, palette: palette) {
    const user = await User.findByIdAndUpdate(id, { palette }, {
        new: true,
    });

    if (user === null) throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    return user;
}

/**
 * Changes the ``theme`` property of the user with the given ``_id`` and returns the updated user.
 * This function throws an error if the user does not exist.
 */
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