import { Request } from "express";
import { IUserState } from "../middlewares/session.middleware";

export interface IRequest extends Request {
    user: IUserState;
}