import type { Command } from ".";
import { memberRoles } from "../index.js";
import {
	GuildMember,
	SlashCommandBuilder,
	Colors,
	EmbedBuilder,
} from "discord.js";
import { grantRole } from "../util/discordManager.js";
import * as db from "../util/db";

export default {
	data: new SlashCommandBuilder()
		.setName("verify")
		.setDescription("Verify a user and IP address")
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
		),
	async execute(interaction) {
		if (!interaction.guild) return;
		const verifiedRoleNames = [];
		const ip = interaction.options.getString("ip");
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
		for (const role of memberRoles) {
			const verifiedRole = interaction.guild.roles.cache.find(
				(r) => r.id === role
			);
			if (!verifiedRole) {
				return interaction.reply({
					content:
						"The verified role could not be found. Please check the role ID in the environment variables.",
					ephemeral: true,
				});
			}
			verifiedRoleNames.push(verifiedRole.name);
		}

		await db.setData(member.id, ip);
		await grantRole(interaction.guild, member.id, memberRoles);

		return interaction.reply({
			content: `<@!${member.id}> has been verified and granted the ${formatter.format(verifiedRoleNames)} role${verifiedRoleNames.length > 1 ? "s" : ""}.`,
			ephemeral: false,
		});
	},
} as Command;
