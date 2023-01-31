import { Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { mapErrors } from '../util/errorMapper.js';
import { HttpError } from '../util/HttpError.js';
import { HttpStatus } from '../util/httpstatus.enum.js';
import { IRequest } from '../util/IRequest.js';

/**
 * This middleware searches for the product with whatever id was provided in the route parameters.
 * If the product exists, it will be attached to the request object.
 * If the product does not exist, the request will be aborted. 
 */
export async function attachProductToRequest(req: IRequest, res: Response, next: NextFunction) {
    const productId = req.params['id'];
    try {
        const product = await productService.findProductById(productId);
        if (!product) {
            throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
        }

        req.product = product;
        next();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
}

/**
 * This middleware authorizes a request if the user is the creator of the product.
 * You can pass the ``attachProductToRequest`` middleware before that to make sure that the product exists.
 * 
 * Alternatively, this middleware can also search the product on its own if no product has been attached to the
 * request object and attach it itself instead.
 * 
 * If you merely want to check whether the user is the creator without authorizing the request,
 * use the ``checkIfUserIsTheCreatorOfTheProduct`` middleware
 */
export async function authorizeOwner(req: IRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw new HttpError('Invalid session', HttpStatus.UNAUTHORIZED);
        }
        
        const userId = req.user._id;
        const productId = req.params['id'];
        if (req.product) {
            const ownerId = req.product.owner;
            if (ownerId.toString() === userId) {
                next();
            } else {
                throw new HttpError('You must be the creator of the product to perform this action', HttpStatus.FORBIDDEN);
            }
        } else {
            const product = await productService.findProductById(productId);
            if (!product) {
                throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND)
            }

            if (product?.owner.toString() === userId) {
                req.product = product;

                next();
            } else {
                throw new HttpError('You must be the creator of the product to perform this action', HttpStatus.FORBIDDEN);
            }
        }
    } catch (err: any) {
        const errors = mapErrors(err);
        
        res.status(err.status).json(errors).end();
    }
}

/**
 * This middleware attaches to the request object information about whether the user
 * is the creator of the product. To abort the request if the user is not the creator of the product,
 * use the ``authorizeOwner`` middleware instead.
 * 
 * This middleware aborts the request if the product does not exist.
 */
export async function checkIfUserIsTheCreatorOfTheProduct(req: IRequest, res: Response, next: NextFunction) {

    try {
        if (!req.user) {
            throw new HttpError('Invalid session', HttpStatus.UNAUTHORIZED);
        }

        req.isOwner = false;
        const userId = req.user._id;
        const productId = req.params['id'];
        if (req.product) {
            const ownerId = req.product.owner;
            if (ownerId.toString() === userId) {
                req.isOwner = true;
            }
        } else {
            const product = await productService.findProductById(productId);
            
            if (!product) {
                throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND)
            }

            if (product?.owner.toString() === userId) {
                req.product = product;
                req.isOwner = true;
            }
        }

        next();
    } catch (err: any) {
        const errors = mapErrors(err)
        res.status(err.status).json(errors).end();
    }
}

/**
 * This middleware authorizes a request if the user is allowed to buy the product.
 * In order to determine whether the user is the owner or not,
 * pass the ``checkIfUserIsTheCreatorOfTheProduct`` middleware before it.
 */

export async function authorizeBuyer(req: IRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw new HttpError('Invalid session', HttpStatus.UNAUTHORIZED);
        }

        req.hasBought = false;
        const userId = req.user._id;
        const productId = req.params['id'];

        const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, productId);
        if (hasBought) {
            throw new HttpError('You have already bought the item', HttpStatus.FORBIDDEN);
        }

        if (req.isOwner) {
            throw new HttpError('You cannot buy a product that you have created', HttpStatus.FORBIDDEN);
        }

        req.hasBought = hasBought;
        next();
    } catch (err: any) {
        const errors = mapErrors(err)
        res.status(err.status).json(errors).end();
    }
}

/**
 * This middleware attaches information to the request object about whether the user has bought the product.
 * 
 * To abort requests if the user has bought the product, use the ``authorizeBuyer`` middleware. 
 */
export async function checkIfUserHasBoughtTheProduct(req: IRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw new HttpError('Invalid session', HttpStatus.UNAUTHORIZED);
        }

        req.hasBought = false;
        const userId = req.user._id;
        const productId = req.params['id'];

        const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, productId);
        req.hasBought = hasBought;

        next();
    } catch (err: any) {
        const errors = mapErrors(err)
        res.status(err.status).json(errors).end();
    }
}