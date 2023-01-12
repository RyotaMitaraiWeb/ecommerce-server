import jsonwebtoken from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { HttpStatus } from '../util/httpstatus.enum.js';
import { palette, theme } from '../src/models/User.model.js';
import { IRequest } from '../util/IRequest.js';

const jwt = jsonwebtoken;
const blacklist = new Set<string>();

export interface IUserState {
    _id: string;
    username: string;
    palette: palette;
    theme: theme;
}

/**
 * This middleware authorizes a request if the user sending it is logged in (aka has a valid JWT token)
 * Upon success, the decoded token is attached to the request object.
 * If all you want is to attach the user to the request object without authorizing the request,
 * use the attachLoginStatusToRequest middleware instead.
 */
export async function authorizeUser(req: IRequest, res: Response, next: NextFunction) {
    try {
        const token = req.headers['authorization'] || '';

        if (blacklist.has(token)) {
            throw Error('Invalid token');
        }

        const user: IUserState = jwt.verify(token, process.env.JWT || 'weioweewniw') as IUserState;
        req.user = user;
        next();

    } catch (err) {
        res.status(HttpStatus.UNAUTHORIZED).json([{
            msg: 'Invalid token',
        }]).end();
    }
}

/**
 * This middleware authorizes a request if the user sending it is NOT logged in (aka does not have a valid JWT token)
 * If all you want is to attach the user to the request object without authorizing the request,
 * use the attachLoginStatusToRequest middleware instead.
 */
export async function authorizeGuest(req: IRequest, res: Response, next: NextFunction) {
    const token = req.headers['authorization'] || '';
    try {
        jwt.verify(token, process.env.JWT || 'weioweewniw') as IUserState;
        res.status(HttpStatus.FORBIDDEN).json([{
            msg: 'You must be logged out to perform this action',
        }]).end();
    } catch {
        next();
    }

    return;
}

/**
 * This middleware attaches the current user to the request object if there is such.
 * This middleware is useful when you merely want to determine the status
 * and perform operations depending on the outcome.
 * If you want to prevent users or guests from accessing certain endpoints,
 * use the authorizeUser or authorizeGuest middlewares instead 
 */
export async function attachLoginStatusToRequest(req: IRequest, _res: Response, next: NextFunction) {
    req.user = {
        _id: '',
        username: '',
        palette: 'deepPurple',
        theme: 'light',
    };

    try {
        const token = req.headers['authorization'] || '';

        if (blacklist.has(token)) {
            throw Error('Invalid token');
        }

        const user: IUserState = jwt.verify(token, process.env.JWT || 'weioweewniw') as IUserState;
        req.user = user;
    } catch {}

    next();
}

/**
 * Adds the token to the blacklist, thereby making it invalid. If you want to ensure
 * that only valid tokens are added to the blacklist, consider passing authorizeUser before passing
 * this middleware. 
 */
export async function blacklistToken(req: IRequest, _res: Response, next: NextFunction) {
    const token = req.headers['authorization'] || '';
    blacklist.add(token);
    next();
}