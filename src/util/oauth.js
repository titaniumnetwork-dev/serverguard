export async function getUserData(token) {
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

export async function invalidateToken(access_token) {
  const response = await fetch("https://discord.com/api/oauth2/token/revoke", {
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

export async function getToken(authCode) {
  const oauthResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: authCode,
      grant_type: "authorization_code",
      redirect_uri: process.env.REDIRECT_URI,
      scope: "identity",
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const tokenData = await oauthResponse.json();
  return tokenData.access_token;
}
