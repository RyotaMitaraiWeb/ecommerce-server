import { beforeEach, describe } from "mocha";
import express, { Response } from 'express';
import { start } from "../init/app.js";
import { attachLoginStatusToRequest, authorizeGuest, authorizeUser, blacklistToken } from "../middlewares/session.middleware.js";
import { IRequest } from "../util/IRequest.js";
import request from 'supertest';
import { HttpStatus } from "../util/httpstatus.enum.js";
import jsonwebtoken from 'jsonwebtoken';
import { expect } from "chai";
import { palette, theme } from "../src/models/User.model.js";

interface IUserStateBody {
    body: {
        _id: string;
        username: string;
        palette: palette;
        theme: theme;
    }
}

const jwt = jsonwebtoken;
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTY3ODkwMTIiLCJ1c2VybmFtZSI6ImFiY2RlIiwicGFsZXR0ZSI6ImluZGlnbyIsInRoZW1lIjoibGlnaHQiLCJpYXQiOjE2NzMyOTk0MDYsImV4cCI6MTY3ODQ4MzQwNn0.M1j_RWXiz4NFvCWLBRqh3r9gWbmregdGC6CnjLvjAzo
describe('Session middleware', async () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';
    let app: any;

    let authorizeUserEndpoint = '/authorizeUser';
    let authorizeGuestEndpoint = '/authorizeGuest';
    let attachLoginStatusToRequestEndpoint = '/attachToken';
    let blacklistTokenEndpoint = '/blacklistToken';

    let fakeToken: string;
    beforeEach(async () => {
        app = await start(express(), testDB);

        // Fake controllers to send requests to, insert the middleware that you want to test
        app.all(authorizeUserEndpoint, authorizeUser, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.user).end();
        });

        app.all(authorizeGuestEndpoint, authorizeGuest, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.user).end();
        });

        app.all(attachLoginStatusToRequestEndpoint, attachLoginStatusToRequest, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.user).end();
        });

        app.all(blacklistTokenEndpoint, authorizeUser, blacklistToken, async (req: IRequest, res: Response) => {
            res.status(HttpStatus.OK).json(req.user).end();
        });

        // Fake token that you can use when you want to successfully verify it
        fakeToken = jwt.sign({
            username: 'abcde',
            _id: '123456789012',
            palette: 'indigo',
            theme: 'light'
        }, process.env.JWT || 'weioweewniw', {
            expiresIn: '1day',
        });
    });

    describe('authorizeUser', async () => {
        it('Proceeds to the next handler in the chain if the token is valid', async () => {
            await request(app)
                .get(authorizeUserEndpoint)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);
        });

        it('Attaches a decoded user to the request object', async () => {
            const user: IUserStateBody = await request(app)
                .get(authorizeUserEndpoint)
                .set('authorization', fakeToken)

            expect(user.body.username).to.be.ok;
            expect(user.body._id).to.be.ok;
            expect(user.body.palette).to.be.ok;
            expect(user.body.theme).to.be.ok;
        });

        it('Aborts if the token is invalid and then returns 401', async () => {
            await request(app)
                .get(authorizeUserEndpoint)
                .set('authorization', 'a')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('authorizeGuest', async () => {
        it('Authorizes a guest successfully', async () => {
            await request(app)
                .get(authorizeGuestEndpoint)
                .set('authorization', '')
                .expect(HttpStatus.OK);
        });

        it('Does not authorize a logged in user', async () => {
            await request(app)
                .get(authorizeGuestEndpoint)
                .set('authorization', fakeToken)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('attachLoginStatusToRequest', async () => {
        it('Successfully attaches the user to the request object', async () => {
            const user: IUserStateBody = await request(app)
                .get(attachLoginStatusToRequestEndpoint)
                .set('authorization', fakeToken)

            expect(user.body.username).to.be.ok;
            expect(user.body._id).to.be.ok;
            expect(user.body.palette).to.be.ok;
            expect(user.body.theme).to.be.ok;
        });

        it('Does not attach the user to the request object for invalid tokens', async () => {
            const user: IUserStateBody = await request(app)
                .get(attachLoginStatusToRequestEndpoint)
                .set('authorization', '')
            expect(user.body).to.not.be.ok;
        });
    });

    describe('blacklistToken', async () => {
        it('Blacklists the token', async () => {
            await request(app)
                .get(blacklistTokenEndpoint)
                .set('authorization', fakeToken)
                .expect(HttpStatus.OK);

                await request(app)
                .get(blacklistTokenEndpoint)
                .set('authorization', fakeToken)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    })
});