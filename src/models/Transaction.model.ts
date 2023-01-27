import { model, Schema, Types } from "mongoose";
import { IProduct } from "./Product.model";
import { IUser } from "./User.model";

/**
 * ```typescript
 * interface ITransaction {
    buyer: IUser;
    product: IProduct;
    createdAt: Date;
}
 * ```
 */
export interface ITransaction {
    buyer: IUser;
    product: IProduct;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    buyer: {
        type: Types.ObjectId,
        ref: 'User',
    },
    product: {
        type: Types.ObjectId,
        ref: 'Product'
    }
}, {
    timestamps: true,
});

const Transaction = model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;