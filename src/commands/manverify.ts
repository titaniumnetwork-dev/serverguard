import type { Command } from "./index.ts";
import { memberRoles } from "../index.ts";
import {
	GuildMember,
	SlashCommandBuilder,
	Colors,
	EmbedBuilder,
	InteractionContextType,
} from "discord.js";
import { grantRole } from "../util/discordManager.ts";
import { verifiedRoleNames } from "../index.ts";
import * as db from "../db/db.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("manverify")
		.setDescription("Manually verify a user and IP address")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to verify")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("ip")
				.setDescription("The IP address to verify")
				.setRequired(true)
		)
		.setContexts(InteractionContextType.Guild),
		
	async execute(interaction) {
		if (!interaction.channel) return;
		if (!interaction.guild) return;
		const ip = interaction.options.getString("ip");
		if (!ip) return;
		const user = interaction.options.getUser("user");
		if (!user) {
			const embed = new EmbedBuilder()
				.setTitle("Not found")
				.setDescription(`<@!${user}> does not exist.`)
				.setColor(Colors.Red);
			return interaction.reply({ embeds: [embed], ephemeral: false });
		}
		const member = interaction.options.getMember("user") as GuildMember;
		if (!member) return;

		const mainId = await db.checkIp(ip);

		if (mainId) {
			return interaction.reply({
				content: `<@!${member.id}>'s IP is already verified as <@!${mainId}>.`,
				ephemeral: true,
			});
		}

		const formatter = new Intl.ListFormat("en", {
			style: "long",
			type: "conjunction",
		});

		await db.setData(member.id, ip);
		await grantRole(interaction.guild, member.id, memberRoles);
		const embed = new EmbedBuilder()
			.setTitle("Manually verified.")
			.setDescription(
				`<@!${member.id}> has been verified and granted the ${formatter.format(verifiedRoleNames)} role${verifiedRoleNames.length > 1 ? "s" : ""}.`
			)
			.setColor("#600080");
		return interaction.reply({
			embeds: [embed],
			ephemeral: false,
		});
	},
} as Command;
