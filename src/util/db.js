import { Pool } from "pg";
import crypto from 'crypto';

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export async function checkIp(ip) {
    const client = await pool.connect();
    try {
        const hashed = crypto.createHash('sha256').update(process.env.SALT + ip).digest('base64');
        const res = await client.query("SELECT id FROM userdata WHERE ip = $1;", [hashed]);
        if (res.rowCount !== 0) {
            return res.rows[0].id;
        }
        return false;
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
        await client.query("INSERT INTO userdata VALUES($1,$2);", [id,hashedIp]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function deleteData(id) {
    const client = await pool.connect();
    try {
        await client.query("DELETE FROM userdata WHERE id=$1;", [id]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function pendingDeletion(id) {
    const client = await pool.connect();
    try {
        await client.query("INSERT INTO pending VALUES($1);", [id]);
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
            text: 'SELECT id FROM pending;'
        });
        const ids = result.rows.map(row => row[0]);
        if (ids.length) {
            await client.query("DELETE FROM userdata WHERE id = ANY ($1);", [ids]);
        }
        await client.query("TRUNCATE table pending;");
        return ids;
    } catch (err) {
        console.log(err);
    }
    finally {
        client.release();
    }
}

export async function cancelPending(id) {
    const client = await pool.connect();
    try {
        await client.query("DELETE FROM pending WHERE id=$1", [id]);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        client.release();
    }
}