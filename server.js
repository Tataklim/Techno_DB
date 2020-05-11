// 1xx: Information
// 2xx: Success
// 3xx: Redirection
// 4xx: Client Error
// 5xx: Server Error
import express from 'express';
import bodyParser from 'body-parser';
import db from 'pg';
import {router} from './internal/app/router/router.js';
const hostname = '127.0.0.1';
const port = 5000;

const app = express();
app.use(bodyParser.json());

const pool = new db.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'techno_db',
    password: 'postgres',
    port: 5432,
});

router(app, pool);

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
