import type { Command } from "./index.ts";
import { memberRoles, verificationMap, verifiedRoleNames } from "../index.ts";
import crypto from "node:crypto";
import {
	SlashCommandBuilder,
	Colors,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	InteractionContextType,
} from "discord.js";
import * as db from "../db/db.ts";
import { getIpData } from "../util/ip.ts";
import { grantRole } from "../util/discordManager.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("verify")
		.setDescription(
			"Manually verify a user and IP address. (interactive version)"
		)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to verify.")
				.setRequired(true)
		)
		.setContexts(InteractionContextType.Guild),

	async execute(interaction) {
		if (!interaction.channel) return;
		if (!interaction.guild) return;
		const user = interaction.options.getUser("user");
		if (!user) {
			const embed = new EmbedBuilder()
				.setTitle("Not found")
				.setDescription(`<@!${user}> does not exist.`)
				.setColor(Colors.Red);
			return interaction.reply({ embeds: [embed] });
		}

		const verifyEmbed = new EmbedBuilder()
			.setTitle("Manual Verification")
			.setDescription(
				"Click on the following link to proceed with the manual verification process."
			)
			.setColor("#600080");
		const state = crypto.randomBytes(16).toString("hex");
		const verifyButton = new ButtonBuilder()
			.setLabel("Verify now!")
			.setURL(
				`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&scope=identify&state=${state}`
			)
			.setStyle(ButtonStyle.Link);

		const verifyRow = new ActionRowBuilder().addComponents(verifyButton);

		const { promise, resolve, reject } = Promise.withResolvers();
		verificationMap.set(state, resolve);
		const timeout = setTimeout(() => {
			verificationMap.delete(state);
			reject("Timeout occured.");
			interaction.editReply({
				content: "A timeout occurred, please run the command again!",
				embeds: [],
			});
		}, 120000);

		await interaction.reply({
			embeds: [verifyEmbed],
			components: [verifyRow],
		});

		const data = (await promise) as any;
		clearTimeout(timeout);
		if (user.id !== data.id) {
			return interaction.editReply({
				content: `<@!${user.id}> authenticated as <@!${data.id}>. (user mismatch)`,
				embeds: [],
				components: [],
			});
		}
		const mainId = await db.checkIp(data.ip);

		if (mainId) {
			return interaction.editReply({
				content: `<@!${user.id}>'s IP is already verified as <@!${mainId}>.`,
				embeds: [],
				components: [],
			});
		}

		const ipData = await getIpData(data.ip);
		const confirmationEmbed = new EmbedBuilder()
			.setTitle("Would you like to verify this user?")
			.setDescription(
				`
					Country: ${ipData.country}
					Timezone: ${ipData.timezone}
					ISP: ${ipData.isp}
					ORG: ${ipData.org}
					AS: ${ipData.as}
					AS Name: ${ipData.asname}
      			`
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
		const confirmationRow = new ActionRowBuilder().addComponents(
			confirmButton,
			denyButton
		);
		const confirmationMessage = await interaction.editReply({
			embeds: [confirmationEmbed],
			components: [confirmationRow],
		});
		const collector = interaction.channel.createMessageComponentCollector({
			filter: (i) => i.customId === "confirm" || i.customId === "deny",
		});
		collector.on("collect", async (i) => {
			if (i.user.id !== interaction.user.id) return;
			if (i.customId === "confirm") {
				await db.setData(user.id, data.ip);
				await grantRole(interaction.guild, user.id, memberRoles);
				const formatter = new Intl.ListFormat("en", {
					style: "long",
					type: "conjunction",
				});
				const embed = new EmbedBuilder()
					.setTitle("Manually verified.")
					.setDescription(
						`<@!${user.id}> has been verified and granted the ${formatter.format(verifiedRoleNames)} role${verifiedRoleNames.length > 1 ? "s" : ""}.`
					)
					.setColor("#600080");
				await interaction.editReply({ embeds: [embed], components: [] });
			} else if (i.customId === "deny") {
				await interaction.editReply({
					content: "Verification request denied.",
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
