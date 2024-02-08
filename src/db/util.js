import { Pool } from "pg";

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export async function checkIp(hashedIp) {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT id FROM userdata WHERE ip = '${hashedIp}';`);
        return res.rowCount > 0;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
};

export async function setData(id, ip) {
    const client = await pool.connect();
    try {
        await client.query(`INSERT INTO userdata VALUES(${id}, ${ip});`);
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

const bool = await checkIp(10.675581339297423);