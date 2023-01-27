import { model, Schema, Types } from "mongoose";
import { IProduct } from "./Product.model";
import * as bcrypt from 'bcrypt';

export type palette = 'blue' | 'indigo' | 'deepPurple' | 'green' | 'amber' | 'pink';
export type theme = 'light' | 'dark';

/**
 * ```typescript
 * interface IUser {
    _id: Types.ObjectId;
    username: string;
    password: string;
    products: IProduct[],
    boughtProducts: IProduct[],
    palette: string;
    theme: string;
}
 * ```
 */
export interface IUser {
    _id: Types.ObjectId;
    username: string;
    password: string;
    products: IProduct[],
    boughtProducts: IProduct[],
    palette: string;
    theme: string;
}

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        minlength: [5, 'Username must be at least five characters'],
        maxlength: [10, 'Username must be no more than ten characters'],
        trim: true,
        unique: true,
        validate: {
            validator(value: string): boolean {
                return /^[a-z][a-z0-9]+$/i.test(value);
            },
            message: 'Username must start with a letter and can only contain alphanumeric characters'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least six characters'],
        trim: true,
    },
    products: [{
        type: Types.ObjectId,
        ref: 'Product',
    }],
    boughtProducts: [{
        type: Types.ObjectId,
        ref: 'Product',
    }],
    palette: {
        type: String,
        enum: {
            values: ['blue', 'indigo', 'deepPurple', 'green', 'amber', 'pink'],
            message: 'Invalid palette',
        },
        default: 'deepPurple',
    },
    theme: {
        type: String,
        enum: {
            values: ['light', 'dark'],
            message: 'Invalid theme',
        },
        default: 'light',
    }
});

// Check if username exists
UserSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('username')) return next(); // runs this validation only when creating user or updating username
    
    const existingUser = await User.findOne({ username: user.username });
    
    if (existingUser) {
        const error = user.invalidate('username', 'Username already exists');
        return next(error);
    }

    return next();
});

// Hash password
UserSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next(); // runs this validation only when creating user or updating password
    try {
        const hashedPassword = await bcrypt.hash(user.password, Number(process.env.SALT_ROUNDS) || 9);
        user.password = hashedPassword;

        return next();
    } catch (err: any) {
        return next(err);
    }
});

const User = model<IUser>('User', UserSchema);

export default User;