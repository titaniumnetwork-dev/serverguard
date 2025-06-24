import type { Command } from "./index.ts";
import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("verifybutton")
		.setDescription(
			"Deploy the button which connects the user to the verification site"
		),
	async execute(interaction) {
		const messageEmbed = new EmbedBuilder()
			.setTitle("Verify with this server")
			.setDescription(
				"In order to gain access to this server, we require verification in order to prevent alting."
			)
			.setColor("#600080");

		const button = new ButtonBuilder()
			.setLabel("Verify now!")
			.setURL(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&scope=identify`)
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder().addComponents(button);

		await interaction.reply({
			embeds: [messageEmbed],
			components: [row],
		});
	},
} as Command;
