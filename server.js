import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';

const {native} = pkg;
import postgres from 'postgres'
import {router} from './internal/app/router/router.js';

const hostname = '0.0.0.0';
const port = 5000;

const app = express();
app.use(bodyParser.json());

// const pool = new native.Pool({
//     user: 'docker',
//     host: 'localhost',
//     database: 'docker',
//     password: 'docker',
//     port: 5432,
// });

const pool = new native.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_nat',
    password: 'postgres',
    port: 5432,
});

// const pool2 = new pkg.Pool({
//     user: 'docker',
//     host: 'localhost',
//     database: 'docker',
//     password: 'docker',
//     port: 5432,
// });
const pool2 = new pkg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'db_nat',
    password: 'postgres',
    port: 5432,
});

// const sql = postgres('postgres://username:password@host:port/database', {
//     host: 'localhost',
//     port: 5432,       // Postgres server port
//     database: 'docker',         // Name of database to connect to
//     username: 'docker',         // Username of database user
//     password: 'docker',         // Password of database user
//     max: 20,         // Max number of connections
// })
const sql = postgres('postgres://username:password@host:port/database', {
    host: 'localhost',
    port: 5432,       // Postgres server port
    database: 'db_nat',         // Name of database to connect to
    username: 'postgres',         // Username of database user
    password: 'postgres',         // Password of database user
    max: 20,         // Max number of connections
})

router(app, pool, pool2, sql);

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
