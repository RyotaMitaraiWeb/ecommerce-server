import express from 'express';
import { start } from './init/app.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
start(app, process.env.DB || '');