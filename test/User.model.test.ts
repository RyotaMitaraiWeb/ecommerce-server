import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose from "mongoose";
import { start } from "../init/app.js";
import User from "../src/models/User.model.js";

describe('User model', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';

    beforeEach(async () => {
        await start(express(), testDB);
        await new User({
            username: 'exists',
            password: '123456',
        }).save();
    });

    describe('Successful cases', async () => {
        it('Creates a valid user', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();

            expect(user.username).to.equal('abcde');
        });

        it('Hashes password successfully', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();

            expect(user.password).to.not.equal('123456');
            expect(user.password.length).to.be.greaterThan(10);
        });

        it('Trims values successfully', async () => {
            const user = new User({
                username: 'abcde ',
                password: '123456 ',
            });

            expect(user.password).to.equal('123456');

            await user.save();

            expect(user.username).to.equal('abcde');
        });
    })

    describe('Username', async () => {
        it('Throws an error for a username that is shorter than 5 characters', async () => {
            const user = new User({
                username: 'a',
                password: '123456',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('minlength');
        });

        it('Throws an error for a username that is longer than 10 characters', async () => {
            const user = new User({
                username: 'ryota123456',
                password: '123456',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('maxlength');
        });

        it('Throws an error for a username that is missing', async () => {
            const user = new User({
                password: '123456'
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('required');
        });

        it('Throws an error for a username that is an empty string', async () => {
            const user = new User({
                username: '',
                password: '123456'
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('required');
        });

        it('Throws an error for a username that starts with a non-letter', async () => {
            const user = new User({
                username: '1abcde',
                password: '123456',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('user defined');
        });

        it('Throws an error for a username that contains a non-alphanumeric character', async () => {
            const user = new User({
                username: 'abc!de',
                password: '123456'
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('user defined');
        });

        it('Does not create when the user already exists', async () => {
            const user = new User({
                username: 'exists',
                password: '123456'
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['username']).to.be.ok;
            expect(error.errors['username'].kind).to.equal('user defined');

        });
    })

    describe('Password', () => {
        it('Throws an error for a password that is shorter than 6 characters', async () => {
            const user = new User({
                username: 'ryota1',
                password: '1',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['password']).to.be.ok;
            expect(error.errors['password'].kind).to.equal('minlength');
        });

        it('Throws an error for a password that is missing', async () => {
            const user = new User({
                username: 'ryota1',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['password']).to.be.ok;
            expect(error.errors['password'].kind).to.equal('required');
        });

        it('Throws an error for a password that is an empty string', async () => {
            const user = new User({
                username: 'ryota1',
                password: '',
            });

            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['password']).to.be.ok;
            expect(error.errors['password'].kind).to.equal('required');
        });
    });

    describe('Palette', async () => {
        it('Defaults to deepPurple', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();

            expect(user.palette).to.equal('deepPurple');
        });

        it('Changes to a valid palette successfully', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();

            user.palette = 'indigo';
            await user.save();
            expect(user.palette).to.equal('indigo');
        });

        it('Throws an error when palette is changed to an invalid one', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            user.palette = 'a';
            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['palette']).to.be.ok;
            expect(error.errors['palette'].kind).to.equal('enum');
        });
    });

    describe('Theme', async () => {
        it('Defaults to light', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();
            expect(user.theme).to.equal('light')
        });

        it('Changes to dark successfully', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            await user.save();

            user.theme = 'dark';
            await user.save();
            expect(user.theme).to.equal('dark')
        });

        it('Defaults to light', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            user.theme = 'a';
            let error: any;

            try {
                await user.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['theme']).to.be.ok;
            expect(error.errors['theme'].kind).to.equal('enum');
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});