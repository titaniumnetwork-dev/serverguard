import { pool } from "../util/db.js";

// helper script to setup a database with the queries in db.sql

const file = Bun.file("./db.sql");
const queries = await file.text();
pool.query(queries);
// end the pool so the script can cleanly exit
await pool.end();
