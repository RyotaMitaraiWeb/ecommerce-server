import { Request } from "express";
import { IUserState } from "../middlewares/session.middleware";
import { IProduct } from "../src/models/Product.model";

/**
 * ```typescript
 * interface IRequest extends Request {
    user?: IUserState;
    product?: IProduct;
    isOwner?: boolean;
    hasBought?: boolean;
}
 * ```
 */
export interface IRequest extends Request {
    user?: IUserState;
    product?: IProduct;
    isOwner?: boolean;
    hasBought?: boolean;
}