import { Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { mapErrors } from '../util/errorMapper.js';
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
            throw Error('Product does not exist');
        }

        req.product = product;
        next();
    } catch (err) {
        const errors = mapErrors(err);
        res.status(HttpStatus.NOT_FOUND).json(errors).end();
    }
}

/**
 * This middleware authorizes a request if the user is the creator of the product.
 * You can pass the ``attachProductToRequest`` middleware before that to make sure that the product exists.
 * Alternatively, this middleware can also search the product on its own if no product has been attached to the
 * request object and attach it itself instead, however, this approach does not abort the request if the product does not exist.
 * If you merely want to check whether the user is the creator without authorizing the request,
 * use the ``checkIfUserIsTheCreatorOfTheProduct`` middleware
 */
export async function authorizeOwner(req: IRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw Error('Invalid session');
        }
        
        const userId = req.user._id;
        const productId = req.params['id'];
        if (req.product) {
            const ownerId = req.product.owner;
            if (ownerId.toString() === userId) {
                next();
            } else {
                throw Error('You must be the creator of the product to perform this action');
            }
        } else {
            const product = await productService.findProductById(productId);
            if (product?.owner.toString() === userId) {
                req.product = product;

                next();
            } else {
                throw Error('You must be the creator of the product to perform this action');
            }
        }
    } catch (err) {
        const errors = mapErrors(err);
        res.status(HttpStatus.FORBIDDEN).json(errors).end();
    }
}

/**
 * This middleware attaches to the request object information about whether the user
 * is the creator of the product. To abort the request if the user is not the creator of the product,
 * use the ``authorizeOwner`` middleware instead. 
 */
export async function checkIfUserIsTheCreatorOfTheProduct(req: IRequest, res: Response, next: NextFunction) {

    try {
        if (!req.user) {
            throw Error('Invalid session');
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

            if (product?.owner.toString() === userId) {
                req.product = product;
                req.isOwner = true;
            }
        }

        next();
    } catch (err) {
        const errors = mapErrors(err)
        res.status(HttpStatus.UNAUTHORIZED).json(errors).end();
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
            throw Error('Invalid session');
        }

        req.hasBought = false;
        const userId = req.user._id;
        const productId = req.params['id'];

        const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, productId);
        if (hasBought) {
            throw Error('User has already bought the item');
        }

        if (req.isOwner) {
            throw Error('Creators cannot buy their own products');
        }

        req.hasBought = hasBought;
        next();
    } catch (err) {
        const errors = mapErrors(err)
        res.status(HttpStatus.FORBIDDEN).json(errors).end();
    }
}

export async function checkIfUserHasBoughtTheProduct(req: IRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user) {
            throw Error('Invalid session');
        }

        req.hasBought = false;
        const userId = req.user._id;
        const productId = req.params['id'];

        const hasBought = await productService.checkIfUserHasBoughtTheProduct(userId, productId);
        req.hasBought = hasBought;
        next();
    } catch (err) {
        const errors = mapErrors(err)
        res.status(HttpStatus.BAD_REQUEST).json(errors).end();
    }
}