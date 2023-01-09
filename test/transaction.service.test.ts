import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose, { Types } from "mongoose";
import { start } from "../init/app.js";
import User from "../src/models/User.model.js";
import Product from "../src/models/Product.model.js";
import Transaction from "../src/models/Transaction.model.js";
import { transactionService } from "../services/transaction.service.js";

describe('transactionService', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';
    let username = 'abcde';
    let password = '123456';

    let name = 'abcde';
    let price = 0.01;
    let image = 'a';

    let id: Types.ObjectId;
    let userId: Types.ObjectId;

    beforeEach(async () => {
        await start(express(), testDB);
        const user = new User({
            username,
            password,
        });

        await user.save();
        userId = user._id;

        // use this for tests involving singular products
        const product = new Product({
            name,
            price,
            image,
            owner: user._id,
        });

        await product.save();

        id = product._id;

        user.products.push(product);
        await user.save();

        // use for tests that involve collections of products
        for (let i = 1; i < 10; i++) {
            const product = new Product({
                price: i,
                image: 'a',
                name: 'product' + i,
                owner: id,
            });

            await product.save();
            user.products.push(product);
            await user.save();
        }
    });

    describe('createTransaction', async () => {
        it('creates a transaction successfully', async () => {
            await transactionService.createTransaction(id, userId);
            const transaction = await Transaction.findOne({ product: id, buyer: userId});
            expect(transaction).to.not.be.null;
        });
    })

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});