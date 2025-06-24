export async function getUserData(token: string) {
	try {
		const query = await fetch("https://discord.com/api/v10/users/@me", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const userData = await query.json();
		return userData;
	} catch (error) {
		console.log(error);
		return null;
	}
}

export async function invalidateToken(access_token: string) {
	await fetch("https://discord.com/api/oauth2/token/revoke", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			token: access_token,
		}),
	});
}

export async function getToken(authCode: string) {
	const oauthResponse = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			code: authCode,
			grant_type: "authorization_code",
			redirect_uri: process.env.REDIRECT_URI,
			scope: "identity",
		}).toString(),
	});

	const tokenData = await oauthResponse.json();
	return tokenData.access_token;
}
