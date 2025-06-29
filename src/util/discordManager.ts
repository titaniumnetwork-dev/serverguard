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
	content: string,
) {
	if (!client.user) return;
	const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
	const username = client.user.username ?? "Unknown";
	const avatarURL = client.user.avatarURL() || "https://i.imgur.com/AfFp7pu.png";
	webhookClient.send({
		username,
		avatarURL,
		content,
	});
}
