export async function checkIp(client, hashedIp) {
    try {
        const res = await client.query(`SELECT id FROM userdata WHERE ip = '${hashedIp}';`);
        return res.rowCount > 0;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

export async function setData(client, id, ip) {
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