import { router as user } from "../src/controllers/user.controller.js";
import { router as product } from "../src/controllers/product.controller.js";
import { Express } from "express";

export function createRoutes(app: Express) {
    app.use(user);
    app.use(product);
    app.get('/', (_req, res) => {
        res.json({
            status: 'running',
        });
    })
}