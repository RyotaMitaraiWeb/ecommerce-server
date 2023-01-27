import express, { Response } from 'express';
import { attachLoginStatusToRequest, authorizeUser } from '../../middlewares/session.middleware.js';
import { mapErrors } from '../../util/errorMapper.js';
import { IRequest } from '../../util/IRequest';
import { HttpStatus } from '../../util/httpstatus.enum.js';
import { attachProductToRequest, authorizeBuyer, authorizeOwner } from '../../middlewares/product.middleware.js';
import { productService } from '../../services/product.service.js';
import { IProduct } from '../models/Product.model.js';
import { checkIfUserHasBoughtTheProduct, checkIfUserIsTheCreatorOfTheProduct } from '../../middlewares/product.middleware.js';
import { HttpError } from '../../util/HttpError.js';
const router = express.Router();

function extractDataFromProduct(product: IProduct) {
    const { name, price, image } = product;
    const _id = product._id.toString();

    return { name, price, image, _id }
}

router.get('/product/:id/isOwner', attachLoginStatusToRequest, authorizeOwner, (req: IRequest, res: Response) => {
    const data = extractDataFromProduct(req.product as IProduct);
    res.status(HttpStatus.OK).json(data).end();
});

router.get('/product/own', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED)
        }

        const userId = req.user._id;
        const by = req.query['by'];
        const sort = req.query['sort'];
        const page = Number(req.query['page']) || 0;
        let sortOptions = undefined;

        if (by && sort) {
            sortOptions = {
                [by as string]: sort
            }
        }

        const products = await productService.getUserProducts(userId, sortOptions as any, page);
        const total = await productService.getUserProductsCount(userId);

        res.status(HttpStatus.OK).json({
            products,
            total
        }).end();

    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

router.get('/product/all', async (req: IRequest, res: Response) => {
    try {
        const by = req.query['by'];
        const sort = req.query['sort'];
        const page = Number(req.query['page']) || 0;
        let sortOptions = undefined;
        if (by && sort) {
            sortOptions = {
                [by as string]: sort
            }
        }

        const products = await productService.findAllProducts(sortOptions as any, page);
        const total = await productService.getProductCount();

        res.status(HttpStatus.OK).json({
            products,
            total,
        }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

router.get('/product/search', async (req: IRequest, res: Response) => {
    try {
        const by = req.query['by'];
        const sort = req.query['sort'];
        const page = Number(req.query['page']) || 0;
        const name = req.query['name'] as string;
        let sortOptions = undefined;
        if (by && sort) {
            sortOptions = {
                [by as string]: sort
            }
        }

        const products = await productService.searchProductsByName(name, sortOptions as any, page);
        const total = await productService.getProductCount(name);

        res.status(HttpStatus.OK).json({
            products,
            total,
        }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

router.get('/product/:id', attachLoginStatusToRequest, attachProductToRequest,
    checkIfUserHasBoughtTheProduct, checkIfUserIsTheCreatorOfTheProduct, async (req: IRequest, res: Response) => {
        const data = extractDataFromProduct(req.product as IProduct);
        res.status(HttpStatus.OK).json({
            ...data,
            hasBought: req.hasBought,
            isOwner: req.isOwner,
            isLogged: req.user?.username !== '',
        }).end();
    });

router.post('/product', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED);
        }

        const { name, price, image } = req.body;
        const product = await productService.createProduct({ name, price, image }, req.user._id);
        const data = extractDataFromProduct(product);

        res.status(HttpStatus.CREATED).json(data).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status || HttpStatus.BAD_REQUEST).json(errors).end();
    }
});

router.put('/product/:id', authorizeUser, authorizeOwner, async (req: IRequest, res: Response) => {
    try {
        const id = req.params['id'];
        const { name, price } = req.body;
        const product = await productService.editProduct(id, { name, price });
        if (product === null) {
            throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
        }

        res.status(HttpStatus.OK).json({ id }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status || HttpStatus.BAD_REQUEST).json(errors).end();
    }

});

router.delete('/product/:id', authorizeUser, authorizeOwner, async (req: IRequest, res: Response) => {
    try {
        const id = req.params['id'];
        const product = await productService.deleteProduct(id);
        if (product === null) {
            throw new HttpError('Product does not exist', HttpStatus.NOT_FOUND);
        }

        res.status(HttpStatus.OK).json({ id }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }

});

router.post('/product/:id/buy', authorizeUser, authorizeBuyer, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED);
        }

        const userId = req.user._id.toString();
        const productId = req.params['id'];

        await productService.buyProduct(userId, productId);
        res.status(HttpStatus.OK).json({
            id: productId,
        }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

export { router };