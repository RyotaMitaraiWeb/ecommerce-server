import { Types } from "mongoose";
import Product from "../src/models/Product.model.js";
import User from "../src/models/User.model.js";
import { transactionService } from "./transaction.service.js";

export type sortCategory = 'asc' | 'desc';

export type sortCategoryOptions = {
    [key: string]: sortCategory,
};

/**
 * @prop {string} name
 * @prop {number} price
 * @prop {string} image
 */
export interface IProductInput {
    name: string;
    price: number;
    image: string;
}

/**
 * Returns the product that has the given id or null if there isn't such
 */
async function findProductById(id: string | Types.ObjectId) {
    return await Product.findById(id);
}

/**
 * Adds the product to the database and updates the creator's products property or throws an error
 * if the creation is invalid.
 */
async function createProduct(product: IProductInput, userId: string | Types.ObjectId) {
    const user = await User.findById(userId);

    if (user === null) {
        throw Error('User does not exist');
    }

    const newProduct = new Product({
        ...product,
        owner: user,
    });

    await newProduct.save();

    user.products.push(newProduct);
    await user.save();

    await transactionService.createTransaction(newProduct, user);
    return newProduct;
};

/**
 *  Edits the product with the given id with the new values or throws an error if the editing is invalid
*/
async function editProduct(id: string | Types.ObjectId, product: IProductInput) {
    const currentProduct = await Product.findByIdAndUpdate(id, product);
    return currentProduct;
}

/**
 * Deletes the product with the given id or throws an error if that is not possible.
 * In addition, the Product model will remove all of the product's instances in users' product collections
 */
async function deleteProduct(id: string | Types.ObjectId) {
    const product = await Product.findOneAndDelete({
        _id: id
    });

    if (product === null) {
        throw Error('Product does not exist');
    }

    return product;
}

/**
 * Returns an array of all products, optionally sorting and paginating them.
 * If you do not pass any arguments, a mere array of the products is returned.
 * If you want to paginate the result, but not sort it, pass undefined as the first argument.
 * By default, the page argument is 0, meaning that it won't paginate at all, unless you explicitly give it a page.
 * If page is passed, but not limit, it will use process.env.PAGES_PER_ROUND in limit's place.
 */
async function findAllProducts(sort?: sortCategoryOptions, page = 0, limit?: number) {
    if (page === 0) return await Product.find().sort(sort);

    limit = limit || Number(process.env.PRODUCTS_PER_PAGE);

    return await Product
        .find()
        .sort(sort)
        .limit(limit)
        .skip(limit * (page - 1));
}

/**
 * Returns an array of all products whose names contain the given string, optionally sorting and paginating them.
 * The search is case insensitive.
 * If you do not pass any additional arguments, the function will simply return an array of all matches.
 * If you want to paginate the result, but not sort it, pass undefined as the second argument (after the name parameter).
 * By default, the page argument is 0, meaning that it won't paginate at all, unless you explicitly give it a page.
 * If page is passed, but not limit, it will use process.env.PAGES_PER_ROUND in limit's place.
 */
async function searchProductsByName(name: string, sort?: sortCategoryOptions, page = 0, limit?: number) {
    if (page === 0) return await Product.find({
        name: RegExp(name, 'i'),
    }).sort(sort);

    limit = limit || Number(process.env.PRODUCTS_PER_PAGE);

    return await Product.find({
        name: RegExp(name, 'i'),
    })
        .sort(sort)
        .limit(limit)
        .skip(limit * (page - 1));
}

/**
 * Returns the amount of products in the database. Useful for pagination.
 */
async function getProductCount() {
    return await Product.find().count();
}

/**
 * Adds the product to the user's boughtProducts property and adds the user to the product's buyers property.
 * Both IDs are converted to ObjectId before executing any operations.
 * The function throws an error if the user/product does not exist, the user has already bought the product,
 * or the user is the owner of the product.
 */
async function buyProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    userId = new Types.ObjectId(userId);
    productId = new Types.ObjectId(productId);

    const product = await Product.findById(productId).populate('owner');
    const user = await User.findById(userId);

    if (product === null) {
        throw Error('Product does not exist');
    }

    if (user === null) {
        throw Error('User does not exist');
    }

    const duplicate = await User.findOne({ boughtProducts: { $in: [productId] } });

    if (duplicate !== null) {
        throw new Error('Product has already been bought');
    }

    if (userId.equals(product.owner._id)) {
        throw new Error('Owners cannot buy their own products');
    }

    product.buyers.push(user);
    await product.save();

    user.boughtProducts.push(product);
    await user.save();

    return product;
}

/**
 * Returns a boolean value indicating if the user has bought the product with the given ID.
 * Throws an error if the user does not exist.
 */
async function checkIfUserHasBoughtTheProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    const user = await User.findById(userId);

    if (user === null) throw Error('User does not exist');

    const boughtProduct = user.boughtProducts.find(bp => bp._id.equals(productId));
    return boughtProduct !== undefined && boughtProduct !== null;
}

/**
 * Returns a boolean value indicating if the user is the creator of the product with the given ID.
 * Throws an error if the product does not exist.
 * Both IDs are converted to ObjectId before executing any operations.
 */
async function checkIfUserIsTheOwnerOfTheProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    userId = new Types.ObjectId(userId);
    productId = new Types.ObjectId(productId);
    const product = await Product.findById(productId).populate('owner');

    if (product === null) throw Error('Product does not exist');
    return userId.equals(product.owner._id);
}

export const productService = {
    findProductById,
    createProduct,
    editProduct,
    deleteProduct,
    findAllProducts,
    searchProductsByName,
    getProductCount,
    buyProduct,
    checkIfUserHasBoughtTheProduct,
    checkIfUserIsTheOwnerOfTheProduct
};