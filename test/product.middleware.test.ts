import { beforeEach, describe } from "mocha";
import express, { Response } from 'express';
import { start } from "../init/app.js";
import { IRequest } from "../util/IRequest.js";
import request from 'supertest';
import { HttpStatus } from "../util/httpstatus.enum.js";
import jsonwebtoken from 'jsonwebtoken';
import { expect } from "chai";
import User from "../src/models/User.model.js";
import mongoose, { Types } from "mongoose";
import Product from "../src/models/Product.model.js";
import { attachLoginStatusToRequest } from "../middlewares/session.middleware.js";
import { attachProductToRequest, authorizeBuyer, authorizeOwner, checkIfUserHasBoughtTheProduct, checkIfUserIsTheCreatorOfTheProduct } from "../middlewares/product.middleware.js";
import { productService } from "../services/product.service.js";

const jwt = jsonwebtoken;
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTY3ODkwMTIiLCJ1c2VybmFtZSI6ImFiY2RlIiwicGFsZXR0ZSI6ImluZGlnbyIsInRoZW1lIjoibGlnaHQiLCJpYXQiOjE2NzMyOTk0MDYsImV4cCI6MTY3ODQ4MzQwNn0.M1j_RWXiz4NFvCWLBRqh3r9gWbmregdGC6CnjLvjAzo
describe('Session middleware', async () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';
    let app: any;

    let attachProductToRequestEndpoint = '/attach';
    let authorizeOwnerEndpoint = '/authorizeOwner';
    let creatorVerificationEndpoint = '/verifyOwner';
    let authorizeBuyerEndpoint = '/authorizeBuyer';
    let verifyPurchaseEndpoint = '/verifyPurchase';

    let fakeToken: string;

    let userId: Types.ObjectId;
    let productId: Types.ObjectId;
    beforeEach(async () => {
        app = await start(express(), testDB);
        const user = new User({
            username: 'abcde',
            password: '123456',
        });

        await user.save();
        userId = user._id;

        const product = new Product({
            name: 'abcde',
            price: 1,
            image: 'a',
            owner: user,
        });

        await product.save();

        user.boughtProducts.push(product);
        await user.save();

        productId = product._id;

        // Fake controllers to send requests to, insert the middleware that you want to test
        app.all(attachProductToRequestEndpoint + '/:id', attachLoginStatusToRequest, attachProductToRequest, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.product).end();
        });

        app.all(authorizeOwnerEndpoint + '/:id', attachLoginStatusToRequest, authorizeOwner, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.product).end();
        });

        app.all(creatorVerificationEndpoint + '/:id', attachLoginStatusToRequest, checkIfUserIsTheCreatorOfTheProduct, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json({
                isOwner: req.isOwner,
            }).end();
        });

        app.all(authorizeBuyerEndpoint + '/:id', attachLoginStatusToRequest, checkIfUserIsTheCreatorOfTheProduct, authorizeBuyer, async (_req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).end();
        });

        app.all(verifyPurchaseEndpoint + '/:id', attachLoginStatusToRequest, checkIfUserHasBoughtTheProduct, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json({
                hasBought: req.hasBought,
            }).end();
        });

        // Fake token that you can use when you want to successfully verify it
        fakeToken = jwt.sign({
            username: 'abcde',
            _id: userId.toString(),
            palette: 'indigo',
            theme: 'light'
        }, process.env.JWT || 'weioweewniw', {
            expiresIn: '1day',
        });
    });

    describe('attachProductToRequest', async () => {
        it('Attaches the product successfully', async () => {
            const product = await request(app)
                .get(attachProductToRequestEndpoint + '/' + productId)
                .expect(HttpStatus.OK);

            expect(product).to.be.ok;
        });

        it('Returns 404 if the product does not exist', async () => {
            await request(app)
                .get('/attach/123456789012')
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('authorizeOwner', async () => {
        it('Attaches the product and returns 200 upon successful authorization', async () => {
            const res = await request(app)
                .get(authorizeOwnerEndpoint + '/' + productId._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);

            expect(res.body).to.be.ok;
        });

        it('Returns 403 if the user is not the owner', async () => {
            const product = await new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner: '123456789012',
            }).save();

            await request(app)
                .get(authorizeOwnerEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Returns 404 if the product does not exist', async () => {
            await request(app)
                .get(authorizeOwnerEndpoint + '/123456789012')
                .set('authorization', fakeToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    })

    describe('checkIfUserIsTheCreatorOfTheProduct', async () => {
        it('Verifies that the user created the product', async () => {
            const res = await request(app)
                .get(creatorVerificationEndpoint + '/' + productId._id)
                .set('authorization', fakeToken);

            expect(res.body).to.deep.equal({ isOwner: true });
        });

        it('Verifies that the user is NOT the creator', async () => {
            const product = await new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner: '123456789012',
            }).save();


            const res = await request(app)
                .get(creatorVerificationEndpoint + '/' + product._id)
                .set('authorization', fakeToken);

            expect(res.body).to.deep.equal({ isOwner: false });
        });

        it('Aborts request if the product does not exist', async () => {
            await request(app)
                .get(creatorVerificationEndpoint + '/123456789012')
                .set('authorization', fakeToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('authorizeBuyer', async () => {
        it('Authorizes the purchase when the user has not bought the product', async () => {
            const owner = await new User({
                username: 'abcde1',
                password: '123456'
            }).save();

            const product = await new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner,
            }).save();

            await request(app)
                .get(authorizeBuyerEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);
        });

        it('Does not authorize the purchase when the user has bought the product', async () => {
            const owner = new User({
                username: 'abcde1',
                password: '123456',
            });

            await owner.save();

            const product = new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner,
            });

            await product.save();

            await productService.buyProduct(userId, product._id);

            await request(app)
                .get(authorizeBuyerEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Does not authorize the purchase when the user is the creator of the product', async () => {
            const product = new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner: userId,
            });

            await product.save();

            await request(app)
                .get(authorizeBuyerEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('Aborts the request if the product does not exist', async () => {
            await request(app)
                .get(authorizeBuyerEndpoint + '/123456789012')
                .set('authorization', fakeToken)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('checkIfUserHasBoughtTheProduct', async () => {
        it('Verifies that the user has not bought the product', async () => {
            const product = new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner: userId,
            });

            await product.save();

            const res = await request(app)
                .get(verifyPurchaseEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);

            expect(res.body).to.deep.equal({ hasBought: false })
        });

        it('Verifies that the user has bought the product', async () => {
            const owner = new User({
                username: 'abcde1',
                password: '123456'
            });

            await owner.save();

            const product = new Product({
                name: 'abcde',
                price: 1,
                image: 'a',
                owner
            });

            await product.save();

            await productService.buyProduct(userId, product._id);

            const res = await request(app)
                .get(verifyPurchaseEndpoint + '/' + product._id)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);

            expect(res.body).to.deep.equal({ hasBought: true })
        });
    })

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});