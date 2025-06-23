import type { Command } from "./index.ts";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { deletePending } from "../db/db.ts";
import { memberRoles } from "../index.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("deletepending")
		.setDescription("Deletes all entries that are pending deletion.")
		.setDMPermission(false),
	async execute(interaction) {
		if (!interaction.guild) return;
		const initialEmbed = new EmbedBuilder()
			.setTitle("Processing data deletion requests...")
			.setDescription(
				`All users that have requested deletion will have their data have been cleared from the database and their roles removed.`
			)
			.setColor("#600080");
		await interaction.reply({ embeds: [initialEmbed], ephemeral: false });
		const result = await deletePending();
		for (const id of result) {
			const member = await interaction.guild.members.fetch(id);
			if (member) {
				member.roles.remove(memberRoles);
				console.log("Removed role from " + id);
			} else {
				console.log(id + " is not in the discord");
			}
		}
		const embed = new EmbedBuilder()
			.setTitle("Data deletion requests have been processed.")
			.setDescription(
				`All users that have requested deletion of their data have been cleared from the database and their roles removed. We have processed ${result.length} requests.`
			)
			.setColor("#600080");
		await interaction.editReply({ embeds: [embed] });
	},
} as Command;
