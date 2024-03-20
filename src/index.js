import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';
import { WebhookClient } from 'discord.js';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import * as db from './util/db.js';
import * as oauth from './util/oauth.js';

async function getIpData(ip) {
    const query = await fetch(`http://ip-api.com/json/${ip}?fields=16990208`);
    const data = await query.json();
    return data;
}

async function grantRole(id) {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    if (await guild.members.fetch(id).catch(() => false)) {
        const member = await guild.members.fetch(id);
        if (!member.roles.cache.some(role => role.id === process.env.ROLE_ID)) {
            member.roles.add(process.env.ROLE_ID);
            console.log('Added role to ' + id);
        }
        if (!member.roles.cache.some(role => role.id === process.env.ROLE_ID_2)) {
            member.roles.add(process.env.ROLE_ID_2);
            console.log('Added role to ' + id);
        }
    }
}

async function logWebhook(id, status, mainId) {
    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });
    if (status === 'passed') {
        webhookClient.send({
            username: client.user.globalName,
            avatarURL: 'https://i.imgur.com/AfFp7pu.png',
            content: `<@!${id}> has successfully verified.`,
        });
        return;
    }
    if (status === 'alt') {
        webhookClient.send({
            username: client.user.globalName,
            avatarURL: 'https://i.imgur.com/AfFp7pu.png',
            content: `<@!${id}> was flagged as an alt account. Their main is <@!${mainId}>.`,
        });
        return;
    }

    if (status === 'proxy') {
        webhookClient.send({
            username: client.user.globalName,
            avatarURL: 'https://i.imgur.com/AfFp7pu.png',
            content: `<@!${id}> attempted to verify over a proxy, VPN, or mobile data.`,
        });
        return;
    }
}

// Initialize the Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.GuildMember,
    ]
});

// Initizalize the Express server
const app = express();
const port = 3113;

// Connect to the database (connection pooling)

// Load the events and commands
const events = await loadEvents(new URL('events/', import.meta.url));
const commands = await loadCommands(new URL('commands/', import.meta.url));

// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN);
const secret = crypto.randomBytes(64).toString('hex');
const authURL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&scope=identify&state=`

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(import.meta.dir + '/public'))

app.get("/login", (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.state = state;
    res.redirect(authURL + state);

});

app.get("/callback", async (req, res) => {
    if (req.query.code === undefined) {
        res.status(401).sendFile('/public/error.html')
        return;
    }
    const callbackState = req.query.state;

    if (callbackState === req.session.state) {
        const token = await oauth.getToken(req.query.code);
        const user = await oauth.getUserData(token);
        const id = user.id;
        await oauth.invalidateToken(token);
        const ip = req.headers['cf-connecting-ip'];

        const ipData = await getIpData(ip);
        if (ipData.mobile === true || ipData.proxy === true || ipData.hosting === true) {
            await logWebhook(id, 'proxy');
            res.redirect('/flagged');
            return;
        }
        if (ipData.isp !== "SpaceX Starlink") {
            await db.setData(id, ip)
            await grantRole(id);
            await logWebhook(id, 'passed');
            res.redirect('/passed');
            return;
        }
        if (await db.checkIp(ip)) {
            const mainId = await db.checkIp(ip);
            if (id == mainId) {
                await grantRole(id);
                res.redirect('/passed');
                return;
            }
            await logWebhook(id, 'alt', mainId);
            await client.roles.add(process.env.ALT_ROLE_ID);
            res.redirect('/altflagged');
            return;
        }
        await db.setData(id, ip)
        await grantRole(id);
        await logWebhook(id, 'passed');
        res.redirect('/passed');
    }
    else {
        res.status(401).send('OAuth callback failed.');
    }
});

app.get("/passed", async (req, res) => {
    res.sendFile('/public/passed.html', { root: import.meta.dir });
});

app.get("/flagged", async (req, res) => {
    res.sendFile('/public/flagged.html', { root: import.meta.dir });
});

app.get("/altflagged", async (req, res) => {
    res.sendFile('/public/altflagged.html', { root: import.meta.dir });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

