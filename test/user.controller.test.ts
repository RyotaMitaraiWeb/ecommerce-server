import { start } from "../init/app.js";
import express from 'express';
import mongoose from "mongoose";
import { beforeEach, describe } from "mocha";
import User from "../src/models/User.model.js";
import Product from "../src/models/Product.model.js";
import request from "supertest";
import { HttpStatus } from "../util/httpstatus.enum.js";
import { expect } from "chai";
import { productService } from "../services/product.service.js";

describe('User controller', async () => {
    let app: any;
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';

    let user1: any;
    let user2: any;
    let product: any;
    let productToBuy: any;


    beforeEach(async () => {
        app = await start(express(), testDB);

        user1 = await new User({
            username: 'abcde',
            password: '123456',
        }).save();

        user2 = await new User({
            username: 'edcba',
            password: '123456',
        }).save();

        product = await new Product({
            name: 'abcde',
            price: 1,
            image: 'a',
            owner: user1,
        }).save();

        productToBuy = await new Product({
            name: 'edcba',
            price: 2,
            image: 'b',
            owner: user2,
        }).save();

        user1.products.push(product);
        user2.products.push(productToBuy);

        await user1.save();
        await user2.save();
    });

    describe('/register', async () => {
        it('Registers successfully', async () => {
            const res = await request(app)
                .post('/user/register')
                .send({
                    username: 'ryota1',
                    password: '123456',
                }).expect(HttpStatus.CREATED);

            expect(res.body).to.be.ok;
            expect(res.body.accessToken.length).to.be.greaterThan(10);
        });

        it('Does not register when validation fails', async () => {
            const res = await request(app)
                .post('/user/register')
                .send({
                    username: 'a',
                    password: '123456',
                }).expect(HttpStatus.BAD_REQUEST);

            expect(Array.isArray(res.body)).to.be.true;
        });

        it('Does not register when the user has a valid JWT', async () => {
            const registeredUser = await request(app)
                .post('/user/register')
                .send({
                    username: 'ryota1',
                    password: '123456',
                });

            const res = await request(app)
                .post('/user/register')
                .send({
                    username: 'ryota2',
                    password: '123456',
                })
                .set('authorization', registeredUser.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);

            expect(Array.isArray(res.body)).to.be.true;
        });
    });

    describe('/login', async () => {
        it('Logs in successfully', async () => {
            const res = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                })
                .expect(HttpStatus.OK);

            expect(res.body).to.be.ok;
            expect(res.body.accessToken.length).to.be.greaterThan(10);
        });

        it('Fails to log in when wrong credentials are provided', async () => {
            const res = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '1234567',
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(Array.isArray(res.body)).to.be.true;
        });

        it('Fails to log in when a JWT is detected', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '1234567',
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);

            expect(Array.isArray(res.body)).to.be.true;
        });
    });

    describe('/', async () => {
        it('Returns the user when sent with a valid JWT', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .get('/user')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.OK);

            expect(res.body).to.be.ok;
            expect(res.body.username).to.equal('abcde');
        });

        it('Does not return a user when the JWT is invalid', async () => {
            await request(app)
                .get('/user')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('/logout', async () => {
        it('Logs out successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .del('/user/logout')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.NO_CONTENT);
            expect(res.body).to.deep.equal({});
        });

        it('Does not log out a user with an invalid JWT', async () => {
            await request(app)
                .del('/user/logout')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('/transactions', async () => {
        it('Gets a list of transactions successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await productService.buyProduct(login.body._id, productToBuy._id);
            const res = await request(app)
                .get('/user/transactions')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.OK);            
            
            expect(res.body.length).to.equal(1);
        });
    });

    describe('/theme', async () => {
        it('Changes theme successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .put('/user/theme')
                .set('authorization', login.body.accessToken)
                .send({
                    theme: 'dark',
                })
                .expect(HttpStatus.OK);

            expect(res.body).to.deep.equal({ theme: 'dark' });
        });

        it('Does not change theme to an invalid one', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .put('/user/theme')
                .set('authorization', login.body.accessToken)
                .send({
                    theme: '1',
                })
                .expect(HttpStatus.BAD_REQUEST);
        });
    });

    describe('/palette', async () => {
        it('Changes palette successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .put('/user/palette')
                .set('authorization', login.body.accessToken)
                .send({
                    palette: 'indigo',
                })
                .expect(HttpStatus.OK);

            expect(res.body).to.deep.equal({ palette: 'indigo' });
        });

        it('Does not change palette to an invalid one', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .put('/user/palette')
                .set('authorization', login.body.accessToken)
                .send({
                    palette: '1',
                })
                .expect(HttpStatus.BAD_REQUEST);
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});