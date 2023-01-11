import express, { Express } from 'express';
import cors from 'cors';
import { connectToDB } from './db.js';
import { createRoutes } from './routes.js';

export async function start(app: Express, db: string) {
    const port = process.env.PORT;
    app.use(express.json());
    app.use(cors({
        origin: process.env.ORIGIN
    }));

    createRoutes(app);

    await connectToDB(db);

    app.listen(port);
    return app;
}