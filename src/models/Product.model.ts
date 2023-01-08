import { model, Types, Schema } from "mongoose";
import { IUser } from "./User.model";

export interface IProduct {
    name: string;
    price: number;
    image: string;
    owner: IUser;
    buyers: IUser[];
}

const ProductSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        minlength: [5, 'Product name must be at least five characters'],
        maxlength: [100, 'Product name must be no more than 100 characters'],
        trim: true,
    },
    price: {
        type: Number,
        min: [0.01, 'Price must be at least 0.01$'],
        required: [true, 'Price is required'],
    },
    image: {
        type: String,
        trim: true,
        required: [true, 'Image is required'],
    },
    owner: {
        type: Types.ObjectId,
        ref: 'User',
    },
    buyers: [{
        type: Types.ObjectId,
        ref: 'User',
    }],
});

// fix price to the second decimal
ProductSchema.pre('save', async function(next) {
    const product = this;
    if (!product.isModified('price')) return next(); // this runs the fixing only when the product is created or the price is change

    const fixedPrice: string = product.price.toFixed(2);
    const newPrice = Number(fixedPrice);
    product.price = newPrice;

    return next();
});

const Product = model<IProduct>('Product', ProductSchema);
export default Product;