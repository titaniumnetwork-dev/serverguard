import type {
	Guild,
	Client,
	RoleResolvable,
	GuildMemberResolvable,
} from "discord.js";
import { WebhookClient } from "discord.js";

export async function grantRole(
	guild: Guild,
	id: GuildMemberResolvable,
	roles: RoleResolvable[] | RoleResolvable
) {
	if (await guild.members.fetch(id).catch(() => false)) {
		const member = await guild.members.fetch(id);
		member.roles.add(roles);
		console.log("Added roles to " + id);
	}
}

export async function checkRole(
	guild: Guild,
	id: GuildMemberResolvable,
	roleID: string
) {
	if (await guild.members.fetch(id).catch(() => false)) {
		const member = await guild.members.fetch(id);
		return member.roles.cache.some((role) => role.id === roleID);
	}
}

export async function logWebhook(
	client: Client,
	id: GuildMemberResolvable,
	status: "passed" | "alt" | "mobile" | "proxy",
	mainId?: string
) {
	if (!client.user) return;
	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });

	if (status === "passed") {
		webhookClient.send({
			username: client.user.globalName!,
			avatarURL: "https://i.imgur.com/AfFp7pu.png",
			content: `<@!${id}> has successfully verified.`,
		});
		return;
	}

	if (status === "alt") {
		webhookClient.send({
			username: client.user.globalName!,
			avatarURL: "https://i.imgur.com/AfFp7pu.png",
			content: `<@!${id}> was flagged as an alt account. Their main is <@!${mainId}>.`,
		});
		return;
	}

	if (status === "mobile") {
		webhookClient.send({
			username: client.user.globalName!,
			avatarURL: "https://i.imgur.com/AfFp7pu.png",
			content: `<@!${id}> Is trying to verify over a potential mobile data connection.`,
		});
		return;
	}

	if (status === "proxy") {
		webhookClient.send({
			username: client.user.globalName!,
			avatarURL: "https://i.imgur.com/AfFp7pu.png",
			content: `<@!${id}> attempted to verify over a proxy or VPN.`,
		});
		return;
	}
}
