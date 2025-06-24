import type { Event } from "../events/index.ts";
import { Events } from "discord.js";

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Logged in as ${client.user.tag} (ID: ${client.user.id})`);
	},
} as Event<Events.ClientReady>;
