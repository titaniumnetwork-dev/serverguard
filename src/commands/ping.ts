import { SlashCommandBuilder } from "discord.js";
import type { Command } from "./index.ts";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),
	async execute(interaction) {
		await interaction.reply("Pong!");
	},
} as Command;
