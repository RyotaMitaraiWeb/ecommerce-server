import { Types } from "mongoose";
import { IProduct } from "../src/models/Product.model.js";
import Transaction from "../src/models/Transaction.model.js";
import { IUser } from "../src/models/User.model";

async function createTransaction(product: IProduct | Types.ObjectId, buyer: IUser | Types.ObjectId) {
    const transaction = new Transaction({ product, buyer });
    await transaction.save();

    return transaction;
}

export const transactionService = {
    createTransaction,
};