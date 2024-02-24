import { Pool } from "pg";
import crypto from 'crypto';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export async function checkIp(ip) {
    const client = await pool.connect();
    try {
        const hashed = crypto.createHash('sha256').update(process.env.SALT + ip).digest('base64');
        const res = await client.query(`SELECT id FROM userdata WHERE ip = '${hashed}';`);
        console.log(res.rowCount);
        return res.rowCount !== 0;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function setData(id, ip) {
    const client = await pool.connect();
    try {
        const hashedIp = crypto.createHash('sha256').update(process.env.SALT + ip).digest('base64');
        const hashedId = crypto.createHash('sha256').update(process.env.SALT + id).digest('base64');
        await client.query(`INSERT INTO userdata VALUES('${hashedId}', '${hashedIp}');`);
        console.log('Success');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function deleteData(id) {
    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM userdata WHERE id='${id}';`);
        console.log('Success');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function pendingDeletion(id) {
    const client = await pool.connect();
    try {
        await client.query(`INSERT INTO pending VALUES(${id});`);
        console.log('Success');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}