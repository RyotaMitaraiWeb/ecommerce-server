import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose from "mongoose";
import { start } from "../init/app.js";
import Product from "../src/models/Product.model.js";
import Transaction from "../src/models/Transaction.model.js";
import User from "../src/models/User.model.js";

describe('Product model', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';

    beforeEach(async () => {
        await start(express(), testDB);
        
    });

    describe('Successful cases', async () => {
        it('Creates a transaction successfully', async () => {
            const user = new User({
                username: 'abcde',
                password: '123456',
            });

            const product = new Product({
                name: 'abcde',
                price: 0.01,
                image: 'a',
            });

            await user.save();
            await product.save();

            const transaction = new Transaction({
                buyer: user,
                product,
            });

            await transaction.save();

            expect(transaction.buyer).to.be.ok;
            expect(transaction.product).to.be.ok;
            expect(transaction.createdAt).to.be.ok;
        })
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});