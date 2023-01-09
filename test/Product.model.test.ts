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
        it('Creates product successfully', async () => {
            const product = new Product({
                name: 'abcde',
                price: 0.01,
                image: 'a',
            });

            await product.save();
            expect(product.name).to.equal('abcde');
            expect(product.price).to.equal(0.01);
            expect(product.image).to.equal('a');
            expect(await Product.findOne()).to.not.be.null;
        });

        it('Trims values successfully', async () => {
            const product = new Product({
                name: ' abcde',
                price: 0.01,
                image: 'a ',
            });

            await product.save();

            expect(product.name).to.equal('abcde');
            expect(product.image).to.equal('a');
        });

        it('Fixes price to the second decimal', async () => {
            const product = new Product({
                name: 'abcde',
                price: 0.011,
                image: 'a',
            });

            await product.save();

            expect(product.price).to.equal(0.01);
        });

        it('Is removed from users\'s product collections when deleted', async () => {
            // Seed the test
            const user1 = new User({ username: 'abcde', password: '123456' });
            const user2 = new User({ username: 'abcde2', password: '123456' });

            const owner = new User({ username: 'owner', password: '123456' });

            await user1.save();
            await user2.save();
            await owner.save()

            const product = new Product(
                { 
                    name: 'abcde', 
                    price: 0.01, 
                    image: 'a', 
                    buyers: [user1, user2],
                    owner
                }
            );
            await product.save();

            user1.boughtProducts.push(product);
            user2.boughtProducts.push(product);

            await user1.save();
            await user2.save();

            // Delete the product and compare
            await Product.findOneAndDelete({ 
                _id: product._id,
            });
            
            const buyer1 = await User.findById(user1._id);
            const buyer2 = await User.findById(user2._id);
            const ownerOfDeletedProduct = await User.findById(owner._id);
            expect(buyer1?.boughtProducts.length).to.equal(0);
            expect(buyer2?.boughtProducts.length).to.equal(0);
            expect(ownerOfDeletedProduct?.products.length).to.equal(0);
        });

        it('Deletes all associated transactions when product is deleted', async () => {
            const user = new User({ username: 'abcde', password: '123456' });
            await user.save();

            const product = new Product(
                { 
                    name: 'abcde', 
                    price: 0.01, 
                    image: 'a', 
                    owner: user,
                }
            );

            await product.save();
            user.products.push(product);
            await user.save();

            const transaction = new Transaction({
                product,
                buyer: user,
            });

            await transaction.save();

            await Product.findOneAndDelete({ 
                _id: product._id,
            });

            const deletedTransaction = await Transaction.findById(transaction._id);
            expect(deletedTransaction).to.be.null;
        });
    });

    describe('Name', async () => {
        it('Throws an error if name is less than 5 characters', async () => {
            const product = new Product({
                name: 'a',
                price: 0.01,
                image: 'a',
            });

            let error: any;

            try {
                await product.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['name']).to.be.ok;
            expect(error.errors['name'].kind).to.equal('minlength');
        });

        it('Throws an error if name is more than 100 characters', async () => {
            const product = new Product({
                name: 'a'.repeat(101),
                price: 0.01,
                image: 'a',
            });

            let error: any;

            try {
                await product.save();
            } catch (err) {
                error = err;
            }

            expect(error.errors['name']).to.be.ok;
            expect(error.errors['name'].kind).to.equal('maxlength');
        });

        it('Throws an error for a missing name', async () => {
            const product = new Product({
                price: 0.01,
                image: 'a',
            });

            let error: any;

            try {
                await product.save();
            } catch (err) {
                error = err;
            }

            expect(error.errors['name']).to.be.ok;
            expect(error.errors['name'].kind).to.equal('required');
        });

        it('Throws an error for a name that is an empty string', async () => {
            const product = new Product({
                name: '',
                price: 0.01,
                image: 'a',
            });

            let error: any;

            try {
                await product.save();
            } catch (err) {
                error = err;
            }

            expect(error.errors['name']).to.be.ok;
            expect(error.errors['name'].kind).to.equal('required');
        });
    });

    describe('Price', async () => {
        it('Throws an error for a price that is lower than 0.01', async () => {
            const product = new Product({
                name: 'abcde',
                price: 0,
                image: 'a',
            });

            let error: any;
            try {
                await product.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['price']).to.be.ok;
            expect(error.errors['price'].kind).to.equal('min');
        });

        it('Throws an error for a missing price', async () => {
            const product = new Product({
                name: 'abcde',
                image: 'a',
            });

            let error: any;
            try {
                await product.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['price']).to.be.ok;
            expect(error.errors['price'].kind).to.equal('required');
        });
    });

    describe('Image', async () => {
        it('Throws an error for a missing image', async () => {
            const product = new Product({
                name: 'abcde',
                price: 0.01,
            });

            let error: any;
            try {
                await product.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['image']).to.be.ok;
            expect(error.errors['image'].kind).to.equal('required');
        });

        it('Throws an error for an image that is an empty string', async () => {
            const product = new Product({
                name: 'abcde',
                price: 0.01,
                image: '',
            });

            let error: any;
            try {
                await product.save();
            } catch (err: any) {
                error = err;
            }

            expect(error.errors['image']).to.be.ok;
            expect(error.errors['image'].kind).to.equal('required');
        });
    })

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});