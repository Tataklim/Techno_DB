import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { native } = pkg;

import {router} from './internal/app/router/router.js';
const hostname = '0.0.0.0';
const port = 5000;

const app = express();
app.use(bodyParser.json());

const pool = new native.Pool({
    user: 'docker',
    host: 'localhost',
    database: 'docker',
    password: 'docker',
    port: 5432,
});

router(app, pool);

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
