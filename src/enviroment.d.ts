declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DISCORD_TOKEN: string;
			CLIENT_ID: string;
			CLIENT_SECRET: string;
			REDIRECT_URI: string;

			DB_FILE: string;

			SALT: string;

			WEBHOOK_URL: string;
			GUILD_ID: string;
			ROLE_IDS: string;
			ALT_ROLE_ID: string;
			MUTED_ROLE_ID: string;
		}
	}
}

export {};
