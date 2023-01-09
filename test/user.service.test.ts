import { IAuthUser, userService } from "../services/user.service.js";

import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose, { Types } from "mongoose";
import { start } from "../init/app.js";
import User from "../src/models/User.model.js";

describe('userService', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';
    let username = 'abcde';
    let password = '123456';

    beforeEach(async () => {
        await start(express(), testDB);
        await new User({
            username,
            password,
        }).save();
    });

    describe('findUserByUsername', async () => {
        it('Finds user successfully', async () => {
            const user = await userService.findUserByUsername(username);
            expect(user).to.not.be.null;
        });

        it('Returns null when user does not exist', async () => {
            const user = await userService.findUserByUsername('a'); // invalid username on first place
            expect(user).to.be.null;
        });
    });

    describe('findUserById', async () => {
        it('Finds user successfully', async () => {
            const user = await User.findOne();
            const userById = await userService.findUserById(user!._id);
            expect(userById).to.not.be.null;
        });

        it('Returns null when user does not exist', async () => {
            const id = new Types.ObjectId();
            const userById = await userService.findUserById(id);
            expect(userById).to.be.null;
        });
    });

    describe('Register', async () => {
        it('Registers successfully', async () => {
            const user: IAuthUser = { 
                username: 'ryota1', 
                password: '123456'
             };

             const newUser = await userService.register(user);
             const registeredUser = await User.findOne({ username: user.username });
             expect(registeredUser).to.not.be.null;
             expect(newUser).to.be.ok;
        });

        it('Fails to register an invalid user', async () => {
            const user: IAuthUser = { 
                username: 'a', 
                password: '123456'
             };

             let error = false;

             try {
                await userService.register(user);
             } catch {
                error = true;
             }

             expect(error).to.be.true;
        });
    });

    describe('Login', async () => {
        it('Logs in successfully', async () => {
            const user: IAuthUser = { username, password };
            const loggedInUser = await userService.login(user);

            expect(loggedInUser).to.be.ok;
            expect(loggedInUser.username).to.equal('abcde');
        });

        it('Throws an error for non-existant user', async () => {
            const user: IAuthUser = { username: 'a', password };
            let error = false;
            try {
                await userService.login(user);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error for wrong password', async () => {
            const user: IAuthUser = { username, password: '1234567' };
            let error = false;
            try {
                await userService.login(user);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        })
    });

    describe('changePalette', async () => {
        it('Changes palette successfully', async () => {
            const user = await User.findOne({ username });
            const updatedUser = await userService.changePalette(user!._id, 'indigo');

            expect(updatedUser?.palette).to.equal('indigo');
        });

        it('Throws an error if the user does not exist', async () => {
            const user = await User.findOne({ username: 'abcde1' });
            let error = false;
            try {
                await userService.changePalette(user!._id, 'indigo');
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error if the palette is invalid', async () => {
            const user = await User.findOne({ username });
            let error = false;
            try {
                await userService.changePalette(user!._id, 'a' as any);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });
    });

    describe('changeTheme', async () => {
        it('Changes theme successfully', async () => {
            const user = await User.findOne({ username });
            const updatedUser = await userService.changeTheme(user!._id, 'dark');

            expect(updatedUser?.theme).to.equal('dark');
        });

        it('Throws an error if the user does not exist', async () => {
            const user = await User.findOne({ username: 'abcde1' });
            let error = false;
            try {
                await userService.changeTheme(user!._id, 'dark');
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error if the palette is invalid', async () => {
            const user = await User.findOne({ username });
            let error = false;
            try {
                await userService.changeTheme(user!._id, 'a' as any);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});