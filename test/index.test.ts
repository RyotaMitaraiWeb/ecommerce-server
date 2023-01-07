import { expect } from "chai";
import express from "express";
import { describe, it } from "mocha";
import mongoose from "mongoose";
import { start } from "../init/app.js";


describe('index.ts', () => {
    let testDB = 'mongodb://127.0.0.1/ecommerce-test';

    beforeEach(async () => {
        await start(express(), testDB);
    });

    it('app mounts', async () => {
        expect(mongoose.connection.name).to.equal('ecommerce-test');
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
    })
})