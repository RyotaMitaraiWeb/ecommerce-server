import { Request } from "express";
import { IUserState } from "../middlewares/session.middleware";
import { IProduct } from "../src/models/Product.model";

export interface IRequest extends Request {
    user: IUserState;
    product: IProduct;
    isOwner: boolean;
    hasBought: boolean;
}