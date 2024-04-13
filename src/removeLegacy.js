import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

// Connect to the database (connection pooling)

// Load the events and commands
const events = await loadEvents(new URL('events/', import.meta.url));
const commands = await loadCommands(new URL('commands/', import.meta.url));

// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN);

const guild = await client.guilds.fetch(process.env.GUILD_ID);
const members = await guild.members.fetch();

for (const member of members) {
  if (
    member[1].roles.cache.some((role) => role.id === process.env.ROLE_ID) &&
    member[1].roles.cache.some((role) => role.id === '830276266686414859')
  ) {
    console.log(member[1].id + ' has the pg and legacy role');
    await member[1].roles.remove('830276266686414859');
  }
}

console.log('done');
