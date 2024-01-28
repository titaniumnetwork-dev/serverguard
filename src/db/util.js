import { Pool } from 'pg';
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export async function checkIp(pool, hashedIp) {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT id FROM userdata WHERE ip = '${hashedIp}';`);
        return res.rowCount > 0;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

export async function setData(pool, id, ip) {
    const client = await pool.connect();
    try {
        const res = await client.query(`INSERT INTO userdata VALUES(${id}, ${ip});`);
        console.log('Success');
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

const bool = await checkIp(10.675581339297423);