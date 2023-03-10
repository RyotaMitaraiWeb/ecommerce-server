import { Types } from "mongoose";
import Product from "../src/models/Product.model.js";
import User from "../src/models/User.model.js";
import { HttpError } from "../util/HttpError.js";
import { HttpStatus } from "../util/httpstatus.enum.js";
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
    image?: string;
}

/**
 * Returns the product that has the given id or null if there isn't such
 */
async function findProductById(id: string | Types.ObjectId) {
    try {
        return await Product.findById(id);
    } catch {
        return null;
    }
}

/**
 * Returns an array of products that were created by the user with the provided id.
 * The result can optionally be sorted and paginated (default six products per page).
 
 * If you want to paginate the results but not sort them, pass ``undefined`` as the second argumnet
 * 
 */
async function getUserProducts(userId: string | Types.ObjectId, sort?: sortCategoryOptions, page = 0, limit?: number) {
    try {
        if (page === 0) return await Product
            .find({ owner: userId })
            .select('name price image')
            .collation({ locale: 'en' })
            .sort(sort);

        limit = limit || Number(process.env.PRODUCTS_PER_PAGE);

        const products = await Product
            .find({ owner: userId })
            .collation({ locale: 'en' })
            .limit(limit)
            .skip(limit * (page - 1))
            .sort(sort)
            .select('name price image');

        return products;
    } catch {
        throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    }
}

/**
 * Returns the amount of existing products that were created by the user with the provided id.
 */
async function getUserProductsCount(userId: string | Types.ObjectId) {
    try {
        return Product.find({ owner: userId }).count();
    } catch {
        throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    }
}

/**
 * Adds the product to the database and updates the creator's products property or throws an error
 * if the creation is invalid.
 */
async function createProduct(product: IProductInput, userId: string | Types.ObjectId) {
    const user = await User.findById(userId);

    if (user === null) {
        throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    }

    const newProduct = new Product({
        ...product,
        owner: user,
    });

    await newProduct.save();

    user.products.push(newProduct);
    await user.save();

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
        throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
    }

    return product;
}

/**
 * Returns an array of all products, optionally sorting and paginating them.
 *
 * If you do not pass any arguments, a mere array of the products is returned.
 * 
 * If you want to paginate the result, but not sort it, pass ``undefined`` as the first argument.
 * By default, the ``page`` argument is ``0``, meaning that it won't paginate at all, unless you explicitly give it a page.
 * If ``page`` is passed, but not ``limit``, it will use ``process.env.PRODUCTS_PER_PAGE`` in limit's place.
 */
async function findAllProducts(sort?: sortCategoryOptions, page = 0, limit?: number) {
    try {
        if (page === 0) return await Product.find().sort(sort);

        limit = limit || Number(process.env.PRODUCTS_PER_PAGE);

        return await Product
            .find()
            .collation({ locale: 'en' })
            .sort(sort)
            .limit(limit)
            .skip(limit * (page - 1));
    } catch {
        throw new HttpError('Invalid option', HttpStatus.BAD_REQUEST);
    }
}

/**
 * Returns an array of all products whose names contain the given string, optionally sorting and paginating them.
 * The search is case insensitive.

 * If you do not pass any additional arguments, the function will simply return an array of all matches.

 * If you want to paginate the result, but not sort it, pass ``undefined`` as the second argument (after the name parameter).
 * By default, the ``page`` argument is ``0``, meaning that it won't paginate at all, unless you explicitly give it a page.
 * If ``page`` is passed, but not ``limit``, it will use ``process.env.PRODUCTS_PER_PAGE`` in ``limit``'s place.
 */
async function searchProductsByName(name: string, sort?: sortCategoryOptions, page = 0, limit?: number) {
    try {
        if (page === 0) return await Product.find({
            name: RegExp(name, 'i'),
        }).collation({ locale: 'en' }).sort(sort);

        limit = limit || Number(process.env.PRODUCTS_PER_PAGE);

        return await Product.find({
            name: RegExp(name, 'i'),
        })
            .collation({ locale: 'en' })
            .sort(sort)
            .limit(limit)
            .skip(limit * (page - 1));
    } catch {
        throw new HttpError('Invalid option', HttpStatus.BAD_REQUEST);
    }
}

/**
 * Returns the amount of products in the database. Useful for pagination.

 * If an argument is passed to this function, it will instead return the number of products
    whose name contains the given string.
 */
async function getProductCount(name = '') {
    return await Product.find({
        name: RegExp(name, 'i')
    }).count();
}

/**
 * Adds the product to the user's boughtProducts property and adds the user to the product's buyers property.
 * Both IDs are converted to ``ObjectId`` before executing any operations.
 * The function throws an error if the user/product does not exist, the user has already bought the product,
 * or the user is the owner of the product.
 */
async function buyProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    const product = await Product.findById(productId);
    const user = await User.findById(userId);

    if (product === null) {
        throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
    }

    if (user === null) {
        throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
    }

    const duplicate = user.boughtProducts.find(bp => bp._id.toString() === productId)

    if (duplicate) {
        throw new HttpError('You have already bought this product', HttpStatus.FORBIDDEN);
    }

    if (userId.toString() === product.owner.toString()) {
        throw new HttpError('You cannot buy a product that you have created', HttpStatus.FORBIDDEN);
    }

    product.buyers.push(user);
    await product.save();

    user.boughtProducts.push(product);
    await user.save();

    await transactionService.createTransaction(product, user);


    return product;
}

/**
 * Returns a boolean value indicating if the user has bought the product with the given ID.
 * Throws an error if the user does not exist.
 */
async function checkIfUserHasBoughtTheProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    try {
        const user = await User.findById(userId);

        if (user === null) throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);

        const boughtProduct = user.boughtProducts.find(bp => bp._id.equals(productId));

        return boughtProduct !== undefined && boughtProduct !== null;
    } catch {
        return false;
    }
}

/**
 * Returns a boolean value indicating if the user with the given ID
 * is the creator of the product with the given ID.
 * Throws an error if the product does not exist.
 */
async function checkIfUserIsTheOwnerOfTheProduct(userId: string | Types.ObjectId, productId: string | Types.ObjectId) {
    const product = await Product.findById(productId);

    if (product === null) throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
    return userId.toString() === product.owner.toString();
}

export const productService = {
    findProductById,
    getUserProducts,
    getUserProductsCount,
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