import { ChatInputCommandInteraction, Client, Events } from "discord.js";
import type { Event } from "../events/index.ts";
import type { Command } from "../commands/index.ts";
import { pendingDeletion, cancelPending } from "../db/db.ts";

export function registerEvents(
	commands: Map<string, Command>,
	events: Event[],
	client: Client
) {
	// Create an event to handle command interactions
	const interactionCreateEvent = {
		name: Events.InteractionCreate,
		async execute(interaction) {
			if (!interaction.isCommand()) return;

			const command = commands.get(interaction.commandName);

			if (!command) {
				throw new Error(`Command '${interaction.commandName}' not found.`);
			}

			await command.execute(interaction as ChatInputCommandInteraction);
		},
	} as Event<Events.InteractionCreate>;

	const threadCreateEvent = {
		name: Events.ThreadCreate,
		async execute(thread, newlyCreated) {
			if (newlyCreated) {
				const messages = await thread.messages.fetch();
				const firstMessage = messages.first();
				if (!firstMessage) return;
				firstMessage.react("👍"); // Thumbs Up
				firstMessage.react("👎"); // Thumbs Down
			}
		},
	} as Event<Events.ThreadCreate>;

	const memberRemoveEvent = {
		name: Events.GuildMemberRemove,
		async execute(member) {
			await pendingDeletion(member.id);
		},
	} as Event<Events.GuildMemberRemove>;

	const memberJoinEvent = {
		name: Events.GuildMemberAdd,
		async execute(member) {
			await cancelPending(member.id);
		},
	} as Event<Events.GuildMemberAdd>;

	for (const event of [
		...events,
		interactionCreateEvent,
		threadCreateEvent,
		memberJoinEvent,
		memberRemoveEvent,
	]) {
		client[event.once ? "once" : "on"](event.name, async (...args: any[]) =>
			event.execute(...args)
		);
	}
}
