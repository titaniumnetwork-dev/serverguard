export async function getIpData(ip: string) {
	const query = await fetch(`http://ip-api.com/json/${ip}?fields=66842623`);
	const data = await query.json();
	return data;
}
