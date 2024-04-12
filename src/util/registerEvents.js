import { Events } from 'discord.js';
import { pendingDeletion, cancelPending } from './db.js';

/**
 * @param {Map<string, import('../commands/index.js').Command>} commands
 * @param {import('../events/index.js').Event[]} events
 * @param {import('discord.js').Client} client
 */
export function registerEvents(commands, events, client) {
  // Create an event to handle command interactions
  /** @type {import('../events/index.js').Event<Events.InteractionCreate>} */
  const interactionCreateEvent = {
    name: Events.InteractionCreate,
    async execute(interaction) {
      if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);

        if (!command) {
          throw new Error(`Command '${interaction.commandName}' not found.`);
        }

        await command.execute(interaction);
      }
    },
  };

  /** @type {import('../events/index.js').Event<Events.ThreadCreate>} */
  const threadCreateEvent = {
    name: Events.ThreadCreate,
    async execute(thread, newlyCreated) {
      if (newlyCreated) {
        const messages = await thread.messages.fetch();
        const firstMessage = messages.first();
        firstMessage.react('👍'); // Thumbs Up
        firstMessage.react('👎'); // Thumbs Down
      }
    },
  };

  /** @type {import('../events/index.js').Event<Events.GuildMemberRemove>} */
  const memberRemoveEvent = {
    name: Events.GuildMemberRemove,
    async execute(member) {
      await pendingDeletion(member.id);
    },
  };

  /** @type {import('../events/index.js').Event<Events.GuildMemberAdd>} */
  const memberJoinEvent = {
    name: Events.GuildMemberAdd,
    async execute(member) {
      await cancelPending(member.id);
    },
  };

  for (const event of [
    ...events,
    interactionCreateEvent,
    threadCreateEvent,
    memberJoinEvent,
    memberRemoveEvent,
  ]) {
    client[event.once ? 'once' : 'on'](event.name, async (...args) =>
      event.execute(...args),
    );
  }
}
