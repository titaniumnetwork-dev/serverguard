# ServerGuard

An open source alternative to Double Counter. Known within the Titanium Network community as "Cybermonay" or "Proxyguard".
Created in response to mistrust of DC's development team as well as a desire to put control of network data back in the hands of our users.

## Prerequisites

- Node.js 18+ or Bun 
- A Server To Run Everything On
- Access to the Discord Developer Portal

## Installation

1. Clone the repository:
```bash
git clone https://github.com/titaniumnetwork-dev/serverguard
cd serverguard
```

2. Install dependencies:
```bash
# Install Bun

npm install -g bun

# Install Dependecies

bun install
```

#### Install PostgreSQL:
```
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

```

#### Create Database and User:
```bash
# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Create a new db
CREATE DATABASE serverguard;

# Create a new user (replace 'youruser' and 'yourpassword')
CREATE USER youruser WITH PASSWORD 'yourpassword';

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE serverguard TO youruser;

# Connect to the new database
\c serverguard

# Create the required tables
CREATE TABLE userdata (
    id VARCHAR(100),
    ip VARCHAR(100)
);

CREATE TABLE pending (
    id VARCHAR(100)
);

# Exit PostgreSQL
\q
```

4. Set up the Discord Bot:

#### Create A Discord Bot:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Save the bot token (you'll need it for the .env file)
5. Under "Privileged Gateway Intents", enable:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
6. Go to "OAuth2" → "General"
   - Save the Client ID and Client Secret
   - Add your redirect URI (e.g., `https://mydomain.com/callback`)
7. Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`, `identify`
   - Select bot permissions:
     - Administrator

5. Configure environment variables:
- mv `example.env` to `.env`
- Fill in the following required variables:

```env
DISCORD_TOKEN=        # Bot token 
APPLICATION_ID=       # Application ID
CLIENT_ID=           # OAuth2 Client ID
CLIENT_SECRET=       # OAuth2 Client Secret
REDIRECT_URI=        # OAuth2 redirect URI (e.g., https://domain.com/callback)
DOMAIN=              # Your domain with your protocol

DB_USER=             # db user you created
DB_HOST=localhost    # db host (localhost for local setup)
DB_PASSWORD=         # db password you set
DB_PORT=5432        # Default PostgreSQL port

SALT=               # Random string 

GUILD_ID=           # Your server ID 
ROLE_ID=            # Verified member role ID 
ALT_ROLE_ID=        # Alt account role ID 
MUTED_ROLE_ID=      # Muted role ID

WEBHOOK_URL=       
```

## Usage

1. Deploy Discord bot commands:
```bash
bun run src/util/deploy.js
```

2. Start the server:
```bash
bun run start
```

4. The server will start on port 3113 by default

5. Reverse proxy to your domain using caddy or nginx

## Credits

- [Reinin](https://reinin.dev): Lead project developer
- [proudparrot](https://github.com/proudparrot2): Frontend developer
- Riftriot and Rafflesia: Helped a lot and gave good feedback
- All the testers!

## Frontend Source
[Source repo for frontend](https://github.com/proudparrot2/proxyguard)

