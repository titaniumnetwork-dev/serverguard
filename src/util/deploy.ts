import type { Command } from "../commands/index.js";
import { API } from "@discordjs/core/http-only";
import { REST } from "discord.js";

export async function registerCommands(commands: Map<string, Command>) {
	console.log("Started refreshing application (/) commands.");
	const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
	const api = new API(rest);

	const commandData = [...commands.values()].map((command) =>
		command.data.toJSON()
	);
	await api.applicationCommands.bulkOverwriteGlobalCommands(
		process.env.APPLICATION_ID,
		commandData
	);

	console.log("Successfully reloaded application (/) commands.");
}
