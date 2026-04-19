export async function getIpData(ip: string) {
	const query = await fetch(`http://ip-api.com/json/${ip}?fields=66842623`);
	const data = await query.json();
    if (ip.startsWith("5.188.124.")) {
		data.hosting = false;
		data.proxy = false;
		data.mobile = false;
	}
	return data;
}
