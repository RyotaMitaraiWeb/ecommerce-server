import { start } from "../init/app.js";
import express from 'express';
import mongoose from "mongoose";
import { beforeEach, describe } from "mocha";
import User from "../src/models/User.model.js";
import Product from "../src/models/Product.model.js";
import request from "supertest";
import { HttpStatus } from "../util/httpstatus.enum.js";
import { expect } from "chai";

describe('Product controller', async () => {
    let app: any;
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';

    let user1: any;
    let user2: any;
    let product1: any;
    let product2: any;


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

        product1 = await new Product({
            name: 'abcde',
            price: 1,
            image: 'a',
            owner: user1,
        }).save();

        product2 = await new Product({
            name: 'edcba',
            price: 2,
            image: 'b',
            owner: user2,
        }).save();

        user1.products.push(product1);
        user2.products.push(product2);

        await user1.save();
        await user2.save();
    });

    describe('/', async () => {
        it('Retrieves a product successfully', async () => {
            const res = await request(app)
                .get('/product/' + product1._id)
                .expect(HttpStatus.OK);

            expect(typeof res.body.isOwner).to.equal('boolean');
            expect(typeof res.body.hasBought).to.equal('boolean');
            expect(typeof res.body.isLogged).to.equal('boolean');
            expect(res.body.name).to.be.ok;
            expect(res.body.price).to.be.ok;
            expect(res.body.image).to.be.ok;
        });

        it('Returns 404 for non-existant products', async () => {
            await request(app)
                .get('/product/123456789012')
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('create', async () => {
        it('Creates the product', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .post('/product')
                .send({
                    name: 'product',
                    image: 'a',
                    price: 1,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.CREATED);

            expect(res.body._id).to.be.ok;
        });

        it('fails to create when validation fails', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .post('/product')
                .send({
                    name: 'a',
                    image: 'a',
                    price: 1,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('fails to create when user is not logged in', async () => {
            await request(app)
                .post('/product')
                .send({
                    name: 'a',
                    image: 'a',
                    price: 1,
                })
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('edit', async () => {
        it('Edits successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .put('/product/' + product1._id.toString())
                .send({
                    name: 'newname',
                    price: 5,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.OK);

            expect(res.body.id.toString()).to.equal(product1._id.toString());
            const product = await Product.findById(product1._id);
            expect(product?.name).to.equal('newname');
            expect(product?.price).to.equal(5);
        });

        it('Fails to edit when a validation error occurs', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .put('/product/' + product1._id.toString())
                .send({
                    name: 'newname',
                    price: 0,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('Fails to edit when the user is the not the creator', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'edcba',
                    password: '123456',
                });

            await request(app)
                .put('/product/' + product1._id.toString())
                .send({
                    name: 'newname',
                    price: 0,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Fails to edit when the user is not logged in', async () => {
            await request(app)
                .put('/product/' + product1._id.toString())
                .send({
                    name: 'newname',
                    price: 0,
                })
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Fails to edit when the product does not exist', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .put('/product/123456789012')
                .send({
                    name: 'newname',
                    price: 1,
                })
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('delete', async () => {
        it('Deletes successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            const res = await request(app)
                .del('/product/' + product1._id.toString())
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.OK);

            expect(res.body.id.toString()).to.equal(product1._id.toString());
            const product = await Product.findById(product1._id);
            expect(product).to.be.null;
        });

        it('Fails to delete when the user is not the creator', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'edcba',
                    password: '123456',
                });

            await request(app)
                .del('/product/' + product1._id.toString())
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Fails to delete when the user is not logged in', async () => {

            await request(app)
                .del('/product/' + product1._id.toString())
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Fails to delete a product that does not exist', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .del('/product/123456789012')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('/all', async () => {
        it('Returns a list of all products', async () => {
            const res = await request(app)
                .get('/product/all')
                .expect(HttpStatus.OK);
            expect(res.body.total).to.equal(2);
            expect(Array.isArray(res.body.products)).to.be.true;
        });

        it('Returns a sorted list of products', async () => {
            const res = await request(app)
                .get('/product/all')
                .query({ sort: 'desc', by: 'price' })
                .expect(HttpStatus.OK)
            expect(res.body.total).to.equal(2);
            expect(res.body.products[0].price).to.equal(2);
            expect(res.body.products[1].price).to.equal(1);
        });

        it('Returns a paginated list of products', async () => {
            for (let i = 1; i <= 10; i++) {
                await new Product({
                    name: 'product' + i,
                    price: i,
                    image: 'a',
                }).save();
            }

            process.env.PRODUCTS_PER_PAGE = "6";

            const res = await request(app)
                .get('/product/all')
                .query({ page: '1' })
                .expect(HttpStatus.OK)
            expect(res.body.products.length).to.equal(6);
            expect(res.body.total).to.equal(12);
        });

        it('Returns a paginated sorted list of products', async () => {
            for (let i = 1; i <= 10; i++) {
                await new Product({
                    name: 'product' + i,
                    price: i,
                    image: 'a',
                }).save();
            }

            process.env.PRODUCTS_PER_PAGE = "6";

            const res = await request(app)
                .get('/product/all')
                .query({ page: '1', sort: 'desc', by: 'price' })
                .expect(HttpStatus.OK)
            expect(res.body.products.length).to.equal(6);
            expect(res.body.total).to.equal(12);
            expect(res.body.products[0].price).to.equal(10);
        });
    });

    describe('/search', async () => {
        it('Returns a list of products that contain the given name (case insensitive)', async () => {
            const res = await request(app)
                .get('/product/search')
                .query({ name: 'ab' })
                .expect(HttpStatus.OK);

            expect(res.body.products.length).to.equal(1);
            expect(res.body.total).to.equal(1);
        });

        it('Returns a sorted list of products that contain the given name', async () => {
            await new Product({
                name: 'abcde',
                price: 15,
                image: 'a',
            }).save();

            const res = await request(app)
                .get('/product/search')
                .query({ name: 'ab', sort: 'desc', by: 'price' })
                .expect(HttpStatus.OK);

            expect(res.body.products.length).to.equal(2);
            expect(res.body.total).to.equal(2);
            expect(res.body.products[0].price).to.equal(15);
        });

        it('Returns a paginated list of products that contain the given name', async () => {
            await new Product({
                name: 'abcde',
                price: 15,
                image: 'a',
            }).save();

            await new Product({
                name: 'abcde',
                price: 14,
                image: 'a',
            }).save();

            process.env.PRODUCTS_PER_PAGE = '1';

            const res = await request(app)
                .get('/product/search')
                .query({ name: 'ab', page: '1' })
                .expect(HttpStatus.OK);

            expect(res.body.products.length).to.equal(1);
            expect(res.body.total).to.equal(3);
        });

        it('Returns a sorted paginated list of products that contain the given name', async () => {
            await new Product({
                name: 'abcde',
                price: 15,
                image: 'a',
            }).save();

            await new Product({
                name: 'abcde',
                price: 14,
                image: 'a',
            }).save();

            process.env.PRODUCTS_PER_PAGE = '1';

            const res = await request(app)
                .get('/product/search')
                .query({ name: 'ab', sort: 'desc', by: 'price', page: '1' })
                .expect(HttpStatus.OK);

            expect(res.body.products.length).to.equal(1);
            expect(res.body.total).to.equal(3);
            expect(res.body.products[0].price).to.equal(15);
        });
    });

    describe('/buy', async () => {
        it('Buys successfully', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .post('/product/' + product2._id.toString() + '/buy')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.OK);
        });

        it('Does not buy if the user has already bought the item', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .post('/product/' + product2._id.toString() + '/buy')
                .set('authorization', login.body.accessToken);

            await request(app)
                .post('/product/' + product2._id.toString() + '/buy')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Does not buy if the user is the creator of the product', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .post('/product/' + product1._id.toString() + '/buy')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Does not buy if the user is the creator of the product', async () => {
            await request(app)
                .post('/product/' + product1._id.toString() + '/buy')
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Does not buy a product that does not exist', async () => {
            const login = await request(app)
                .post('/user/login')
                .send({
                    username: 'abcde',
                    password: '123456',
                });

            await request(app)
                .post('/product/123456789012/buy')
                .set('authorization', login.body.accessToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});