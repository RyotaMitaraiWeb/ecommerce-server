import express, { Request, Response } from 'express';
import { userService } from '../../services/user.service.js';
import { transactionService } from '../../services/transaction.service.js';
import jsonwebtoken from 'jsonwebtoken';
import { authorizeGuest, authorizeUser } from '../../middlewares/session.middleware.js';
import { mapErrors } from '../../util/errorMapper.js';
import { IRequest } from '../../util/IRequest';
import { HttpStatus } from '../../util/httpstatus.enum.js';
import { IUser, palette, theme } from '../models/User.model.js';
import { HttpError } from '../../util/HttpError.js';

const router = express.Router();
const jwt = jsonwebtoken;

function extractDataFromUserForJwtToken(user: IUser) {
    const { username, theme, palette } = user;
    const _id = user._id.toString();

    return { username, theme, palette, _id }
}

router.get('/user', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED)
        }
        const data = await userService.findUserById(req.user._id) as IUser;
        const user = extractDataFromUserForJwtToken(data);

        res.status(HttpStatus.OK).json(user).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }    
});

router.get('/user/transactions', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED)
        }
        const transactions = await transactionService.getUserTransactions(req.user._id);
        res.status(HttpStatus.OK).json(transactions).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

router.get('/user/:username', async (req: Request, res: Response) => {
    const username = req.params['username'];
    const user = await userService.findUserByUsername(username);
    try {
        if (user) {
            res.status(HttpStatus.OK).json({}).end();
        } else {
            throw new HttpError('User does not exist', HttpStatus.NOT_FOUND);
        }
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }


});

router.post('/user/register', authorizeGuest, async (req: IRequest, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await userService.register({ username, password });
        const data = extractDataFromUserForJwtToken(user);

        const accessToken = jwt.sign(data, process.env.JWT || 'weioweewniw', {
            expiresIn: '60days',
        });

        res.status(HttpStatus.CREATED).json({
            ...data,
            accessToken
        });

    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status || HttpStatus.BAD_REQUEST).json(errors).end();
    }
});

router.post('/user/login', authorizeGuest, async (req: IRequest, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await userService.login({ username, password });
        const data = extractDataFromUserForJwtToken(user);

        const accessToken = jwt.sign(data, process.env.JWT || 'weioweewniw', {
            expiresIn: '60days',
        });

        res.status(HttpStatus.OK).json({
            ...data,
            accessToken
        });

    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status).json(errors).end();
    }
});

router.delete('/user/logout', authorizeUser, async (_req, res: Response) => {
    res.status(HttpStatus.NO_CONTENT).json({}).end();
});

router.put('/user/theme', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED)
        }

        const theme: theme = req.body.theme;
        await userService.changeTheme(req.user._id, theme);
        
        res.status(HttpStatus.OK).json({ theme }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status || HttpStatus.BAD_REQUEST).json(errors).end();
    }
});

router.put('/user/palette', authorizeUser, async (req: IRequest, res: Response) => {
    try {
        if (!req.user) {
            throw new HttpError('Something went wrong with your session', HttpStatus.UNAUTHORIZED)
        }

        const palette: palette = req.body.palette;
        await userService.changePalette(req.user._id, palette);

        res.status(HttpStatus.OK).json({ palette }).end();
    } catch (err: any) {
        const errors = mapErrors(err);
        res.status(err.status || HttpStatus.BAD_REQUEST).json(errors).end();
    }
});

export { router };