import { URL } from "node:url";
import { Client, GatewayIntentBits } from "discord.js";
import { loadCommands, loadEvents } from "./util/loaders.ts";
import { registerEvents } from "./util/registerEvents.ts";
import { registerCommands } from "./util/deploy.ts";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import * as db from "./db/db.ts";
import * as oauth from "./util/oauth.ts";
import { getIpData } from "./util/ip.ts";
import { checkRole, grantRole, logWebhook } from "./util/discordManager.ts";
// Initialize the Discord client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

// Add your member roles to this array
export const memberRoles = JSON.parse(process.env.ROLE_IDS) as string[];

// Add your flagged alt account roles to this array. Comment this line out if you're not using it. Make sure to also comment out the grantRole function that grants this role.
const altRole = process.env.ALT_ROLE_ID;

// Add your muted roles
const mutedRole = process.env.MUTED_ROLE_ID;

// Initizalize the Express server
const app = new Hono();
const port = 3113;

// Load the events and commands
const events = await loadEvents(new URL("events/", import.meta.url));
const commands = await loadCommands(new URL("commands/", import.meta.url));

// Register the event handlers
registerEvents(commands, events, client);
registerCommands(commands);

// Login to the client
void client.login(process.env.DISCORD_TOKEN);
// manual verification array
export const verificationMap: Map<string, (value?: any) => void> = new Map();
const guild = await client.guilds.fetch(process.env.GUILD_ID);
export const verifiedRoleNames: string[] = [];
for (const role of memberRoles) {
	const verifiedRole = guild.roles.cache.find((r) => r.id === role);
	if (!verifiedRole) {
		throw new Error(
			`The verified role ${role} could not be found. Please check the role ID in the environment variables.`
		);
	}
	verifiedRoleNames.push(verifiedRole.name);
}

app.use(serveStatic({ root: import.meta.dirname + "/public" }));

app.get("/callback", async (c) => {
	const code = c.req.query("code");
	if (!code) {
		return c.redirect("/error.html");
	}
	const ip = c.req.header("X-Forwarded-For");
	if (!ip) {
		return c.redirect("/error.html");
	}
	const token = await oauth.getToken(code);
	const user = await oauth.getUserData(token);
	const id = user.id;
	await oauth.invalidateToken(token);

	const state = c.req.query("state");
	if (state) {
		const manual = verificationMap.get(state);
		if (!manual) return c.redirect("/error.html");
		manual({
			ip,
			id,
		});
		// make a different page eventually
		return c.redirect("/passed.html");
	}

	if (await checkRole(guild, id, mutedRole)) {
		console.log("muted role");
		return c.redirect("/flagged.html");
	}

	if (await checkRole(guild, id, altRole)) {
		console.log("alt role");
		return c.redirect("/flagged.html");
	}

	const mainId = await db.checkIp(ip);

	if (mainId && id !== mainId) {
		await logWebhook(client, id, "alt", mainId);
		grantRole(guild, id, altRole);
		return c.redirect("/altflagged.html");
	}

	const ipData = await getIpData(ip);

	if (ipData.isp === "SpaceX Starlink") {
		if (!mainId) await db.setData(id, ip);
		await grantRole(guild, id, memberRoles);
		await logWebhook(client, id, "passed");
		return c.redirect("/passed.html");
		// This is just for now until an actual solution can be thought up of to fix the 5G Home Users
	}

	if (ipData.mobile) {
		await logWebhook(client, id, "mobile");
		return c.redirect("/mobile.html");
	}

	if (ipData.proxy || ipData.hosting) {
		await logWebhook(client, id, "proxy");
		return c.redirect("/flagged.html");
	}

	if (!mainId) await db.setData(id, ip);
	await grantRole(guild, id, memberRoles);
	await logWebhook(client, id, "passed");
	return c.redirect("/passed.html");
});

export default {
	port,
	fetch: app.fetch,
	development: process.env.NODE_ENV === "development",
};
