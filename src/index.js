import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import * as db from './util/db.js';
import * as oauth from './util/oauth.js';
import { checkRole, grantRole, logWebhook } from './util/discordManager.js';

async function getIpData(ip) {
    const query = await fetch(`http://ip-api.com/json/${ip}?fields=16990208`);
    const data = await query.json();
    return data;
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

// Add your member roles to this array
const memberRoles = [process.env.ROLE_ID, process.env.ROLE_ID_2];

// Add your flagged alt account roles to this array. Comment this line out if you're not using it. Make sure to also comment out the grantRole function that grants this role.
const altRole = process.env.ALT_ROLE_ID;

// Add your muted roles

const mutedRole = process.env.MUTED_ROLE_ID;

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
const guild = await client.guilds.fetch(process.env.GUILD_ID);
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
        if (await checkRole(guild, id, mutedRole)) {
            console.log('alt role');
            return res.redirect('/flagged');
        }
        if (await checkRole(guild, id, altRole)) {
            console.log('alt role');
            return res.redirect('/flagged');
        }
        if (ipData.isp === "SpaceX Starlink") {
            await db.setData(id, ip);
            await grantRole(guild, id, memberRoles);
            await logWebhook(client, id, 'passed');
            return res.redirect('/passed');
            // This is just for now until an actual solution can be thought up of to fix the 5G Home Users
        }
        if (ipData.mobile === true) {
            await logWebhook(client, id, 'mobile');
            return res.redirect('/mobile');
        }
        if (ipData.proxy === true || ipData.hosting === true) {
            await logWebhook(client, id, 'proxy');
            return res.redirect('/flagged');
        }

        if (await db.checkIp(ip)) {
            const mainId = await db.checkIp(ip);
            if (id == mainId) {
                await grantRole(guild, id, memberRoles);
                return res.redirect('/passed');
            }
            await logWebhook(client, id, 'alt', mainId);
            grantRole(guild, id, altRole);
            return res.redirect('/altflagged');
        }
        await db.setData(id, ip)
        await grantRole(guild, id, memberRoles);
        await logWebhook(client, id, 'passed');
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

app.get("/mobile", async (req, res) => {
    res.sendFile('/public/mobile.html', { root: import.meta.dir });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
