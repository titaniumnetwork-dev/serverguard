// dont copy the patented and copyrighted EzCloudflare Solution for hono.
// (joke)
import ipaddr from 'ipaddr.js';
import type { Context } from 'hono';

function setSome<T>(
  set: Set<T>,
  predicate: (value: T, index: number, set: Set<T>) => boolean,
  thisArg?: any
): boolean {
  let index = 0;
  for (const value of set) {
    if (predicate.call(thisArg, value, index, set)) {
      return true;
    }
    index++;
  }
  return false;
}

const cfCiders = new Set<[ipaddr.IPv4 | ipaddr.IPv6, number]>();

async function loadCfCidrs() {
  const [v4, v6] = await Promise.all([
    fetch('https://www.cloudflare.com/ips-v4')
      .then(r => r.text())
      .then(t => t.trim().split('\n')),
    fetch('https://www.cloudflare.com/ips-v6')
      .then(r => r.text())
      .then(t => t.trim().split('\n')),
  ]);

  [...v4, ...v6].forEach(cidr => {
    try {
      cfCiders.add(ipaddr.parseCIDR(cidr))
    } catch {}
  });
}

async function isCloudflare(ip: string): Promise<boolean> {
  if (!cfCiders.size)await loadCfCidrs();
  try {
    const addr = ipaddr.parse(ip);
    return setSome(cfCiders, (([range, bits]) => addr.match(range, bits)));
  } catch {
    return false;
  }
}

function isLoopback(ip: string): boolean {
  try {
    return ipaddr.parse(ip).range() === 'loopback';
  } catch {
    return false;
  }
}

export async function getIp(c: Context): Promise<string | undefined> {
  let ip = (c.req.raw as any).socket?.remoteAddress;

  if (ip && isLoopback(ip)) {
    const xff = c.req.header('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',').map(ip => ip.trim());
      if (parts.length > 0) ip = parts[parts.length - 1];
    }
  }

  if (ip && await isCloudflare(ip)) {
    ip = c.req.header('cf-connecting-ip') ?? ip;
  }

  return ip;
}


export async function getIpData(ip: string) {
	const query = await fetch(`http://ip-api.com/json/${ip}?fields=66842623`);
	const data = await query.json();

	return data;
}
