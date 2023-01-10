import { productService } from "../services/product.service.js";
import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose, { Types } from "mongoose";
import { start } from "../init/app.js";
import User from "../src/models/User.model.js";
import Product from "../src/models/Product.model.js";
import Transaction from "../src/models/Transaction.model.js";

describe('productService', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';
    let username = 'abcde';
    let password = '123456';

    let name = 'abcde';
    let price = 0.01;
    let image = 'a';

    let id: string | Types.ObjectId;
    let userId: string | Types.ObjectId;

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

    describe('findProductById', async () => {
        it('Finds the product with the given ID', async () => {
            const product = await productService.findProductById(id);
            expect(product).to.not.be.null;
        });

        it('Returns null if product does not exist', async () => {
            const product = await productService.findProductById('123456789012');
            expect(product).to.be.null;
        });
    });

    describe('findAllProducts', async () => {
        it('Returns all products when no arguments are passed', async () => {
            const products = await productService.findAllProducts();
            expect(products.length).to.equal(10);
            const notSorted = await Product.find();
            expect(products).to.deep.equal(notSorted);
        });

        it('Returns all products sorted by name', async () => {
            await new Product({ name: 'bcdea', price: 1, image: 'a' }).save();
            const products = await productService.findAllProducts({ name: 'asc' });
            expect(products.map(p => p.name)).to.deep.equal([
                'abcde', 'bcdea', 'product1',
                'product2', 'product3',
                'product4', 'product5',
                'product6', 'product7',
                'product8', 'product9'
            ]);
        });

        it('Returns all products sorted by price', async () => {
            await new Product({ name: 'bcdea', price: 4, image: 'a' }).save();
            const products = await productService.findAllProducts({ price: 'desc' });
            expect(products.map(p => p.price)).to.deep.equal([
                9, 8, 7, 6, 5,
                4, 4, 3, 2, 1,
                0.01
            ]);
        });

        it('Returns an empty array if there are no products', async () => {
            await mongoose.connection.dropDatabase();
            const products = await productService.findAllProducts();
            expect(products).to.deep.equal([]);
        });

        it('Paginates the products when the product count is a factor of the limit', async () => {
            const products = await productService.findAllProducts(undefined, 2, 5);
            expect(products.length).to.equal(5);
        });

        it('Paginates the products when the product count is not a factor of the limit successfully', async () => {
            const products = await productService.findAllProducts(undefined, 2, 8);
            expect(products.length).to.equal(2);
        });

        it('Paginates and sorts successfully', async () => {
            const products = await productService.findAllProducts({ price: 'desc' }, 1, 3);
            expect(products.map(p => p.price)).to.deep.equal([9, 8, 7]);

            const secondPageProducts = await productService.findAllProducts({ price: 'desc' }, 2, 3);
            expect(secondPageProducts.map(p => p.price)).to.deep.equal([6, 5, 4]);
        });
    });

    describe('searchProductsByName', async () => {
        it('Finds matches successfully with no arguments', async () => {
            const products = await productService.searchProductsByName('product');
            expect(products.map(p => p.name)).to.deep.equal([
                'product1', 'product2',
                'product3', 'product4',
                'product5', 'product6',
                'product7', 'product8',
                'product9'
            ]);
        });

        it('Finds case insensitive matches successfully', async () => {
            const products = await productService.searchProductsByName('PRoDuCt');
            expect(products.map(p => p.name)).to.deep.equal([
                'product1', 'product2',
                'product3', 'product4',
                'product5', 'product6',
                'product7', 'product8',
                'product9'
            ]);
        });

        it('Returns an empty array when no matches are found', async () => {
            const products = await productService.searchProductsByName('!');
            expect(products).to.deep.equal([]);
        });

        it('Returns matches sorted', async () => {
            const products = await productService.searchProductsByName('product', { price: 'desc' });
            expect(products.map(p => p.price)).to.deep.equal([9, 8, 7, 6, 5, 4, 3, 2, 1]);
        });

        it('Paginates the results when the product count is a factor of the limit successfully', async () => {
            const products = await productService.searchProductsByName('c', { price: 'desc' }, 1, 5);
            expect(products.map(p => p.price)).to.deep.equal([9, 8, 7, 6, 5]);
        });

        it('Paginates the results when the product count is not a factor of the limit successfully', async () => {
            const products = await productService.searchProductsByName('product', { price: 'desc' }, 2, 5);
            expect(products.map(p => p.price)).to.deep.equal([4, 3, 2, 1]);
        });

        it('Finds case insensitive, paginated, and sorted matches succesfully', async () => {
            const products = await productService.searchProductsByName('pROduCT', { price: 'desc' }, 1, 3);
            expect(products.map(p => p.price)).to.deep.equal([9, 8, 7]);
        })
    });

    describe('getProductCount', async () => {
        it('Gets the product count', async () => {
            const count = await productService.getProductCount();
            expect(count).to.equal(10);
        });

        it('Returns 0 if there are no products', async () => {
            await mongoose.connection.dropDatabase();
            const count = await productService.getProductCount();
            expect(count).to.equal(0);
        });
    })

    describe('createProduct', async () => {
        it('Creates the product successfully', async () => {
            const product = await productService.createProduct({
                name,
                image,
                price,
            }, userId);

            const createdProduct = await Product.findById(product._id);
            const user = await User.findById(userId);

            expect(createdProduct).to.not.be.null;
            expect(createdProduct).to.be.ok;
            expect(createdProduct?.owner).to.deep.equal(user?._id);
        });

        it('Throws an error if creation fails', async () => {
            let error = false;

            try {
                await productService.createProduct({
                    image,
                    price,
                    name: 'a',
                }, userId);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });
    });

    describe('editProduct', async () => {
        it('Edits the poll successfully', async () => {
            const product = await productService.editProduct(id, {
                name: 'newname',
                price: 1,
                image: 'b',
            });

            expect(product).to.not.be.null;

            const editedProduct = await Product.findById(id);
            expect(editedProduct!.name).to.equal('newname');
            expect(editedProduct!.price).to.equal(1);
            expect(editedProduct!.image).to.equal('b');
        });

        it('Throws an error if edit fails', async () => {
            let error = false;

            try {
                await productService.editProduct(id, {
                    name: 'a',
                    price: 1,
                    image: 'b',
                });
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });
    });

    describe('deleteProduct', async () => {
        it('Deletes the product successfully', async () => {
            const product = await productService.deleteProduct(id);
            expect(product).to.not.be.null;

            const deletedProduct = await Product.findById(id);
            expect(deletedProduct).to.be.null;
        });

        it('Removes the product from the owner\'s products', async () => {
            const owner = new User({ username: 'owner', password: '123456' });
            const product = new Product({ name: 'newproduct', price: 1, image: 'a', owner });

            await owner.save();
            await product.save();

            await Product.deleteOne({ _id: product._id });
            const ownerOfDeletedProduct = await User.findById(owner._id);
            expect(ownerOfDeletedProduct?.products.length).to.equal(0);
        });

        it('Removes the product from a buyer\'s bought products', async () => {
            const buyer = new User({ username: 'buyer', password: '123456' });
            const product = new Product({ name: 'newproduct', price: 1, image: 'a', buyers: [buyer] });

            await buyer.save();
            await product.save();

            await Product.deleteOne({ _id: product._id });
            const buyerOfDeletedProduct = await User.findById(buyer._id);
            expect(buyerOfDeletedProduct?.boughtProducts.length).to.equal(0);
        });

        it('Throws an error if delete fails', async () => {
            let error = false;
            try {
                await productService.deleteProduct('123456789012');
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        })
    });

    describe('buyProduct', async () => {
        it('Adds the product to the buyer\'s bought products and the buyer to the product\'s buyers successfully', async () => {
            const owner = new User({ username: 'owner', password: '123456' });
            await owner.save();
            const product = new Product({ name: 'newproduct', price: 1, image: 'a', owner });
            await product.save();

            await productService.buyProduct(userId, product._id);

            const boughtProduct = await Product.findById(product._id);
            expect(boughtProduct?.buyers.length).to.equal(1);

            const buyer = await User.findById(userId).populate('boughtProducts');
            expect(buyer?.boughtProducts.length).to.equal(1);
        });

        it('Creates a transaction when successful', async () => {
            it('Creates a transaction successfully', async () => {
                const owner = new User({ username: 'owner', password: '123456' });
                await owner.save();
                const product = new Product({ name: 'newproduct', price: 1, image: 'a', owner });
                await product.save();

                await productService.buyProduct(userId, product._id);

                const transaction = await Transaction.findOne({ product: product._id, buyer: userId });
                expect(transaction).to.not.be.null;
            });
        })

        it('Throws an error if the user does not exist', async () => {
            let error = false;
            try {
                await productService.buyProduct('123456789012', id);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error if the product does not exist', async () => {
            let error = false;
            try {
                await productService.buyProduct(userId, '123456789012');
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error if the user has already bought the product', async () => {
            const product = new Product({ name: 'newproduct', price: 1, image: 'a' });
            await product.save();

            let error = false;

            try {
                await productService.buyProduct(userId, product._id);
                await productService.buyProduct(userId, product._id);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });

        it('Throws an error if the owner tries to buy the product', async () => {
            const product = new Product({ name: 'newproduct', price: 1, image: 'a', owner: userId });
            await product.save();

            let error = false;
            try {
                await productService.buyProduct(userId, product._id);
            } catch {
                error = true;
            }

            expect(error).to.be.true;
        });
    });

    describe('checkIfUserHasBoughtTheProduct', async () => {
        it('Returns true when the user has bought the product', async () => {
            const product = new Product({ name: 'abcde', price: 1, image: 'a', buyers: [userId] });
            await product.save();

            await User.findByIdAndUpdate(userId, {
                $push: {
                    boughtProducts: product,
                }
            })

            const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, product._id);
            expect(hasBought).to.be.true;
        });

        it('Returns false when the user has not bought the product', async () => {
            const product = new Product({ name: 'abcde', price: 1, image: 'a', buyers: [] });
            await product.save();

            const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, product._id);
            expect(hasBought).to.be.false;
        });
    });

    describe('checkIfUserIsTheOwnerOfTheProduct', async () => {
        it('Returns true when the user is the owner of the product', async () => {
            const product = new Product({ name: 'abcde', price: 1, image: 'a', owner: userId });
            await product.save();

            const isOwner = await productService.checkIfUserIsTheOwnerOfTheProduct(userId, product._id);
            expect(isOwner).to.be.true;
        });

        it('Returns false when the user is the owner of the product', async () => {
            const user = new User({ username: 'owner', password: '123456' });
            await user.save();

            const product = new Product({ name: 'abcde', price: 1, image: 'a', owner: user._id });
            await product.save();

            const isOwner = await productService.checkIfUserIsTheOwnerOfTheProduct(userId, product._id);
            expect(isOwner).to.be.false;
        });
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    });
});