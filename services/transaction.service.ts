import { Types } from "mongoose";
import { IProduct } from "../src/models/Product.model.js";
import Transaction from "../src/models/Transaction.model.js";
import { IUser } from "../src/models/User.model";

/**
 * Creates a new transaction. Generally called when buying a product
 */
async function createTransaction(product: IProduct | Types.ObjectId, buyer: IUser | Types.ObjectId) {
    const transaction = new Transaction({ product, buyer });
    await transaction.save();

    return transaction;
}

/**
 * Finds all of the given user's transactions.
 * Pass false as a second argument if you don't want to load each product's properties.
 * The populated products include only the ``_id``, ``name``, and ``price`` properties.
 */
async function getUserTransactions(userId: string | Types.ObjectId, populate = true) {
    if (!populate) {
        return await Transaction.find({ buyer: userId });
    }
    
    return await Transaction.find({ buyer: userId }).populate('product', 'name price');
}

export const transactionService = {
    createTransaction,
    getUserTransactions,
};