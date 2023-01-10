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
            const transaction = await Transaction.findOne({ product: id, buyer: userId });
            expect(transaction).to.not.be.null;
        });
    });

    describe('getUserTransactions', async () => {
        it('Gets all of the user\'s transactions successfully', async () => {
            await new Transaction({ buyer: userId, product: id }).save();
            const transactions = await transactionService.getUserTransactions(userId);
            expect(transactions.length).to.equal(1);
        });

        it('Populates the product when not called with an additional argument', async () => {
            await new Transaction({ buyer: userId, product: id }).save();
            const transactions = await transactionService.getUserTransactions(userId);
            const transaction = transactions[0];
            expect(transaction.product._id).to.deep.equal(id);
        });

        it('Does not populate the product when false is passed as the second argument', async () => {
            await new Transaction({ buyer: userId, product: id }).save();
            const transactions = await transactionService.getUserTransactions(userId, false);
            const transaction = transactions[0];
            expect(transaction.product).to.deep.equal(id);
        });

        it('Returns an empty array if the user does not have any transactions', async () => {
            const transactions = await transactionService.getUserTransactions(userId);
            expect(transactions).to.deep.equal([]);
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});