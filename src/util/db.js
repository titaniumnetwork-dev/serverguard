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
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function pendingDeletion(id) {
    const client = await pool.connect();
    try {
        await client.query(`INSERT INTO pending VALUES('${id}');`);
        console.log('Success');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

export async function deletePending() {
    const client = await pool.connect();
    try {
        const result = await client.query({
            rowMode: 'array',
            // text: 'DELETE FROM userdata WHERE id IN (select id from pending);'
            text: 'SELECT id FROM pending;'
        });
        let quereyString = '';
        if (result.rowCount === 0) {
            return [[0]];
        }
        result.rows.forEach(row => {
            quereyString += `'${crypto.createHash('sha256').update(process.env.SALT + row[0]).digest('base64')}',`;
        });
        quereyString = quereyString.slice(0, -1);
        await client.query(`DELETE FROM userdata WHERE id IN (${quereyString});`);
        await client.query(`TRUNCATE table pending;`);
        return result.rows;
    } catch (err) {
        console.log(err);
    }
    finally {
        client.release();
    }
}