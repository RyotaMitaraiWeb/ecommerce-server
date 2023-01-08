import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose from "mongoose";
import { start } from "../init/app.js";
import Product from "../src/models/Product.model.js";

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
        })
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