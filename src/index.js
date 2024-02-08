import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';
import { Pool } from 'pg';
import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import * as db from './db/util.js';

async function getIpData(ip) {
    const query = await fetch(`https://proxycheck.io/v2/${ip}&short=1&vpn=3`);
    const data = await query.json();
    return data;
}

async function getUserData(token) {
    try {
        const query = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        const userData = await query.json();
        return userData;
    }
    catch (error) {
        console.log(error)
        return null;
    }

}

async function invalidateToken(access_token) {
    const response = await fetch('https://discord.com/api/oauth2/token/revoke', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'client_id': process.env.CLIENT_ID,
            'client_secret': process.env.CLIENT_SECRET,
            'token': access_token,
        }),
    });
    console.log(response);
}

async function getToken(authCode) {
    const oauthResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: process.env.REDIRECT_URI,
            scope: 'identity',
        }).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    const tokenData = await oauthResponse.json();
    return tokenData.access_token;
}


// Initialize the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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

app.get("/login", (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    console.log(state);
    req.session.state = state;
    res.redirect(authURL + state);

});

app.get("/callback", async (req, res) => {
    const ip = req.ip;
    if (req.query.code === undefined) {
        res.status(401).send('Unauthorized');
        return;
    }
    const callbackState = req.query.state;
    console.log(callbackState);

    if (callbackState === req.session.state) {
        const token = await getToken(req.query.code);
        const user = await getUserData(token);
        console.log(user.id);
        const id = user.id;
        await invalidateToken(token);

        const ipData = await getIpData('198.98.51.189');
        console.log(ipData);
        if (ipData.proxy === "yes" || ipData.vpn === "yes" || ipData.type === "TOR") {
            res.send("flagged");
            return;
        }
        if (db.checkIp(ip)) {
            res.send("flagged");
            return;
        }
        db.setData(id, ip)
        res.send("passed");
    }
    else {
        res.status(401).send('OAuth callback failed.');
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

