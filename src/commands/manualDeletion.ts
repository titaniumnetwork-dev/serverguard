import type { Command } from "./index.ts";
import { memberRoles } from "../index.ts";
import {
	Colors,
	EmbedBuilder,
	GuildMember,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import { cancelPending, deleteData } from "../db/db.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("manualdeletion")
		.setDescription("Manually deletes a user's data from the database.")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to erase from the database.")
				.setRequired(true)
		)
		.setContexts(InteractionContextType.Guild),

	async execute(interaction) {
		const user = interaction.options.getUser("user");
		if (!user) {
			const embed = new EmbedBuilder()
				.setTitle("Not found")
				.setDescription(`<@${user}> does not exist.`)
				.setColor(Colors.Red);
			return await interaction.reply({ embeds: [embed] });
		}
		const member = interaction.options.getMember("user") as GuildMember;
		await cancelPending(user.id);
		await deleteData(user.id);
		if (member) {
			member.roles.remove(memberRoles);
			console.log("Removed role from " + user);
		}
		const embed = new EmbedBuilder()
			.setTitle("Manual Data Deletion Request Processed.")
			.setDescription(
				`<@${user.id}> has been deleted from the database successfully.`
			)
			.setColor("#600080");
		await interaction.reply({ embeds: [embed] });
	},
} as Command;
