import { Database } from "bun:sqlite";
import crypto from "node:crypto";

export const db = new Database(process.env.DB_FILE, { create: true });
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS userdata (
		id VARCHAR(100),
		ip VARCHAR(100)
	);
`
).run();

db.prepare(
	`
	CREATE TABLE IF NOT EXISTS pending (
		id VARCHAR(100)
	);
`
).run();

function hashIp(ip: string) {
	const hash = crypto.createHash("sha256");
	hash.update(process.env.SALT);
	hash.update(ip);

	return hash.digest("base64");
}

export async function checkIp(ip: string) {
	try {
		const hashedIp = hashIp(ip);
		const res = await db
			.prepare("SELECT id FROM userdata WHERE ip = ?")
			.get(hashedIp);
		if (!res) return false;

		return res.id;
	} catch (err) {
		console.error(err);
	}
}

export async function setData(id: string, ip: string) {
	try {
		const hashedIp = hashIp(ip);
		db.prepare("INSERT INTO userdata VALUES (?, ?)").run(id, hashedIp);
	} catch (err) {
		console.error(err);
	}
}

export async function deleteData(id: string) {
	try {
		db.prepare("DELETE FROM userdata WHERE id = ?").run(id);
	} catch (err) {
		console.error(err);
	}
}

export async function pendingDeletion(id: string) {
	try {
		db.prepare("INSERT INTO pending VALUES (?)").run(id);
	} catch (err) {
		console.error(err);
	}
}

export async function deletePending() {
	try {
		const result = db.prepare("SELECT id FROM pending").all();
		const ids = result.map((row) => row.id);
		if (ids.length) db.prepare("DELETE FROM userdata WHERE id IN (SELECT value FROM json_each(?))").run(JSON.stringify(ids));
		db.prepare("DELETE FROM pending").run();

		return ids;
	} catch (err) {
		console.log(err);
	}
}

export async function cancelPending(id: string) {
	try {
		db.prepare("DELETE FROM pending WHERE id = ?").run(id);
	} catch (err) {
		console.log(err);
	}
}
