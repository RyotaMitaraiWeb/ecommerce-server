import { router as user } from "../src/controllers/user.controller.js";
import { Express } from "express";

export function createRoutes(app: Express) {
    app.use(user);
    app.get('/', (_req, res) => {
        res.json({
            status: 'running',
        });
    })
}