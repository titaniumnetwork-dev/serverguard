import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';
import express from "express";

// Initialize the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Initizalize the Express server
const app = express();
const port = 3113;

// Load the events and commands
const events = await loadEvents(new URL('events/', import.meta.url));
const commands = await loadCommands(new URL('commands/', import.meta.url));

// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN);

let ip;

app.get("/", async (req, res) => {
    ip = '198.98.51.189';
    const query = await fetch(`https://proxycheck.io/v2/${ip}&short=1&vpn=3`);
    const data = await query.json();
    console.log(data);
    if (data.proxy === "yes" || data.vpn === "yes" || data.type === "TOR") {
        res.send("flagged");
    }
    else {
        res.send("passed");
    }

});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});