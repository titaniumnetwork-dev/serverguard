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
	const member = await guild.members.fetch(id);
	if (!member) return;

	member.roles.add(roles);
	console.log("Added roles to " + id);
}

export async function checkRole(
	guild: Guild,
	id: GuildMemberResolvable,
	roleID: string
) {
	const member = await guild.members.fetch(id);
	if (!member) return false;

	return member.roles.cache.some((role) => role.id === roleID);
}

export async function logWebhook(
	client: Client,
	id: GuildMemberResolvable,
	status: "passed" | "alt" | "mobile" | "proxy",
	mainId?: string
) {
	if (!client.user) return;
	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
	const username = client.user.globalName ?? "Unknown";
	const avatarURL =
		client.user.avatarURL() ?? "https://i.imgur.com/AfFp7pu.png";
	if (status === "passed") {
		webhookClient.send({
			username,
			avatarURL,
			content: `<@!${id}> has successfully verified.`,
		});
		return;
	}

	if (status === "alt") {
		webhookClient.send({
			username,
			avatarURL,
			content: `<@!${id}> was flagged as an alt account. Their main is <@!${mainId}>.`,
		});
		return;
	}

	if (status === "mobile") {
		webhookClient.send({
			username,
			avatarURL,
			content: `<@!${id}> Is trying to verify over a potential mobile data connection.`,
		});
		return;
	}

	if (status === "proxy") {
		webhookClient.send({
			username,
			avatarURL,
			content: `<@!${id}> attempted to verify over a proxy or VPN.`,
		});
		return;
	}
}
