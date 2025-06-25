import type { Command } from "./index.ts";
import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	SlashCommandBuilder,
	InteractionContextType,
	MessageFlags,
} from "discord.js";
import { pendingDeletion } from "../db/db.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("deletionrequest")
		.setDescription("Requests the deletion of your data from the database.")
		.setContexts(InteractionContextType.Guild),

	async execute(interaction) {
		if (!interaction.channel) return;
		const confirmationEmbed = new EmbedBuilder()
			.setTitle("Confirmation")
			.setDescription(
				"Are you sure you want to request the deletion of your data?"
			)
			.setColor("#600080");
		const confirmButton = new ButtonBuilder()
			.setCustomId("confirm")
			.setLabel("Yes")
			.setStyle(ButtonStyle.Success);
		const denyButton = new ButtonBuilder()
			.setCustomId("deny")
			.setLabel("No")
			.setStyle(ButtonStyle.Danger);
		const row = new ActionRowBuilder().addComponents(confirmButton, denyButton);
		const confirmationMessage = await interaction.reply({
			embeds: [confirmationEmbed],
			components: [row],
			flags: [MessageFlags.Ephemeral],
		});
		const collector = interaction.channel.createMessageComponentCollector({
			filter: (i) => i.customId === "confirm" || i.customId === "deny",
		});
		collector.on("collect", async (i) => {
			if (i.customId === "confirm") {
				await pendingDeletion(interaction.user.id);
				const successEmbed = new EmbedBuilder()
					.setTitle("Success!")
					.setDescription(
						"You have successfully submitted a data deletion request. Note that we process requests on the first of each month."
					)
					.setColor("#600080");
				await interaction.editReply({ embeds: [successEmbed], components: [] });
			} else if (i.customId === "deny") {
				await interaction.editReply({
					content: "Deletion request cancelled.",
					embeds: [],
					components: [],
				});
			}
		});
		collector.on("end", () => {
			if (!confirmationMessage.deleted) {
				confirmationMessage.edit({ embeds: [], components: [] });
			}
		});
	},
} as Command;
