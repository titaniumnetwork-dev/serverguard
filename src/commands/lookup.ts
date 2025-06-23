import type { Command } from "./index.ts";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getIpData } from "../util/ip.ts";

export default {
	data: new SlashCommandBuilder()
		.setName("lookup")
		.setDescription("Lookup an IP address")
		.addStringOption((option) =>
			option
				.setName("ip")
				.setDescription("The IP address to lookup")
				.setRequired(true)
		),
	async execute(interaction) {
		const ip = interaction.options.getString("ip");
		if (!ip) return;
		const ipData = await getIpData(ip);
		const embed = new EmbedBuilder()
			.setTitle(`IP lookup of ${ip}`)
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
			.setColor("#57b9ff");
		await interaction.editReply({ embeds: [embed], components: [] });
	},
} as Command;
