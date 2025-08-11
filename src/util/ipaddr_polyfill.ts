/**
 * ipaddr.js polyfill
 * Big big thanks to ipaddr.js since i use quite some code and took great inspiration from them.
 * Only written in house because of crystals (his full username is CRAZY crystals for a reason...
 * it is 36kb minified, 12kb minified, and 1.9kb gzipped)
 * References:
 * - IPv4 ranges: https://en.wikipedia.org/wiki/Reserved_IP_addresses
 * - IPv6 ranges & IPv4-mapped: https://tools.ietf.org/html/rfc4291
 * - CIDR matching concept: https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing
 */

export type IPvXRangeDefaults =
	| "unicast"
	| "unspecified"
	| "multicast"
	| "linkLocal"
	| "loopback"
	| "reserved"
	| "benchmarking"
	| "amt";

export type IPv4Range =
	| IPvXRangeDefaults
	| "broadcast"
	| "carrierGradeNat"
	| "private"
	| "as112";
export type IPv6Range =
	| IPvXRangeDefaults
	| "uniqueLocal"
	| "ipv4Mapped"
	| "rfc6145"
	| "rfc6052"
	| "6to4"
	| "teredo"
	| "as112v6"
	| "orchid2"
	| "droneRemoteIdProtocolEntityTags";

export type RangeList<T> = { [name: string]: [T, number] | [T, number][] };

abstract class IP {
	abstract kind(): "ipv4" | "ipv6";
	abstract toByteArray(): number[];
	abstract toNormalizedString(): string;
	abstract toString(): string;
	abstract match(other: IP | [IP, number], cidrRange?: number): boolean;

	prefixLengthFromSubnetMask(): number | null {
		return null;
	}
}

function matchCIDR(
	first: number[],
	second: number[],
	partSize: number,
	cidrBits: number
): boolean {
	if (first.length !== second.length) {
		throw new Error("ipaddr polyfill: length mismatch in CIDR match");
	}
	for (let i = 0; i < first.length && cidrBits > 0; i++) {
		const bitsToCheck = Math.min(partSize, cidrBits);
		const shift = partSize - bitsToCheck;
		const mask = ((1 << bitsToCheck) - 1) << shift;
		if ((first[i] & mask) !== (second[i] & mask)) return false;
		cidrBits -= bitsToCheck;
	}
	return true;
}

function expandIPv6(
	input: string,
	partsCount: number
): { parts: number[] } | null {
	if (input.indexOf("::") !== input.lastIndexOf("::")) return null;
	const zoneIndex = input.indexOf("%");
	if (zoneIndex !== -1) {
		input = input.substring(0, zoneIndex);
	}
	if (input.includes("::")) {
		const present = input.replace("::", ":").split(":").filter(Boolean).length;
		const missingCount = partsCount - present;
		if (missingCount < 0) return null;
		const replacement = ":" + "0:".repeat(missingCount);
		input = input.replace("::", replacement);
	}
	if (input.startsWith(":")) input = input.slice(1);
	if (input.endsWith(":")) input = input.slice(0, -1);
	const parts = input.split(":").map((p) => parseInt(p, 16));
	if (parts.length !== partsCount) return null;
	if (parts.some((p) => Number.isNaN(p) || p < 0 || p > 0xffff)) return null;
	return { parts };
}

function subnetMatch<T extends IP>(
	address: T,
	rangeList: RangeList<T>,
	defaultName = "unicast"
): string {
	for (const rangeName in rangeList) {
		if (!Object.prototype.hasOwnProperty.call(rangeList, rangeName)) continue;
		const subnetsRaw = rangeList[rangeName];
		const arr = Array.isArray(subnetsRaw[0])
			? (subnetsRaw as [T, number][])
			: [subnetsRaw as [T, number]];
		for (const subnet of arr) {
			if (
				address.kind() === subnet[0].kind() &&
				address.match(subnet[0], subnet[1])
			) {
				return rangeName;
			}
		}
	}
	return defaultName;
}

export class IPv4 extends IP {
	octets: number[];
	constructor(octets: number[]) {
		super();
		if (octets.length !== 4)
			throw new Error("ipaddr polyfill: IPv4 constructor expects 4 octets");
		this.octets = octets;
	}
	kind(): "ipv4" {
		return "ipv4";
	}
	toByteArray(): number[] {
		return [...this.octets];
	}
	toNormalizedString(): string {
		return this.octets.join(".");
	}
	toString(): string {
		return this.toNormalizedString();
	}
	match(
		other: IPv4 | IPv6 | [IPv4 | IPv6, number],
		cidrRange?: number
	): boolean {
		if (Array.isArray(other)) {
			cidrRange = other[1];
			other = other[0];
		}
		if (other.kind() !== "ipv4")
			throw new Error("ipaddr polyfill: cannot match ipv4 with non-ipv4");
		return matchCIDR(this.octets, (other as IPv4).octets, 8, cidrRange ?? 32);
	}
	range(): string {
		return subnetMatch(this, IPv4.SpecialRanges);
	}
	subnetMatch(rangeList: RangeList<IPv4>, defaultName?: string): string {
		return subnetMatch(this, rangeList, defaultName);
	}
	static parse(addr: string): IPv4 {
		const parts = addr.split(".");
		if (parts.length !== 4) throw new Error("ipaddr polyfill: invalid IPv4");
		const octets = parts.map((p) => {
			const n = parseInt(p, 10);
			if (n < 0 || n > 255 || isNaN(n))
				throw new Error("ipaddr polyfill: invalid IPv4 octet");
			return n;
		});
		return new IPv4(octets);
	}
	static parseCIDR(str: string): [IPv4, number] {
		const match = str.match(/^(.+)\/(\d+)$/);
		if (!match) throw new Error("ipaddr polyfill: invalid IPv4 CIDR");
		const maskLength = parseInt(match[2]);
		if (maskLength < 0 || maskLength > 32)
			throw new Error("ipaddr polyfill: invalid mask length");
		return [IPv4.parse(match[1]), maskLength];
	}
	static isValid(addr: string): boolean {
		try {
			IPv4.parse(addr);
			return true;
		} catch {
			return false;
		}
	}
	static isValidCIDR(addr: string): boolean {
		try {
			IPv4.parseCIDR(addr);
			return true;
		} catch {
			return false;
		}
	}
	static SpecialRanges: RangeList<IPv4> = {
		unspecified: [[new IPv4([0, 0, 0, 0]), 8]],
		broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
		multicast: [[new IPv4([224, 0, 0, 0]), 4]],
		linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
		loopback: [[new IPv4([127, 0, 0, 0]), 8]],
		carrierGradeNat: [[new IPv4([100, 64, 0, 0]), 10]],
		private: [
			[new IPv4([10, 0, 0, 0]), 8],
			[new IPv4([172, 16, 0, 0]), 12],
			[new IPv4([192, 168, 0, 0]), 16],
		],
		reserved: [
			[new IPv4([192, 0, 0, 0]), 24],
			[new IPv4([192, 0, 2, 0]), 24],
			[new IPv4([192, 88, 99, 0]), 24],
			[new IPv4([198, 18, 0, 0]), 15],
			[new IPv4([198, 51, 100, 0]), 24],
			[new IPv4([203, 0, 113, 0]), 24],
			[new IPv4([240, 0, 0, 0]), 4],
		],
		as112: [
			[new IPv4([192, 175, 48, 0]), 24],
			[new IPv4([192, 31, 196, 0]), 24],
		],
		amt: [[new IPv4([192, 52, 193, 0]), 24]],
	};
}

export class IPv6 extends IP {
	parts: number[];
	zoneId?: string;
	constructor(parts: number[], zoneId?: string) {
		super();
		if (parts.length !== 8)
			throw new Error("ipaddr polyfill: IPv6 constructor expects 8 parts");
		this.parts = parts;
		this.zoneId = zoneId;
	}
	kind(): "ipv6" {
		return "ipv6";
	}
	toByteArray(): number[] {
		const bytes: number[] = [];
		for (const part of this.parts) {
			bytes.push((part >> 8) & 0xff, part & 0xff);
		}
		return bytes;
	}
	toNormalizedString(): string {
		return this.parts.map((p) => p.toString(16).padStart(4, "0")).join(":");
	}
	toString(): string {
		let bestStart = -1,
			bestLen = 0,
			curStart = -1,
			curLen = 0;
		for (let i = 0; i < 8; i++) {
			if (this.parts[i] === 0) {
				if (curStart === -1) curStart = i;
				curLen++;
			} else {
				if (curLen > bestLen) {
					bestStart = curStart;
					bestLen = curLen;
				}
				curStart = -1;
				curLen = 0;
			}
		}
		if (curLen > bestLen) {
			bestStart = curStart;
			bestLen = curLen;
		}
		if (bestLen < 2) return this.parts.map((p) => p.toString(16)).join(":");
		const left = this.parts.slice(0, bestStart).map((p) => p.toString(16));
		const right = this.parts
			.slice(bestStart + bestLen)
			.map((p) => p.toString(16));
		return (
			(left.length ? left.join(":") : "") +
			"::" +
			(right.length ? right.join(":") : "") +
			(this.zoneId ? `%${this.zoneId}` : "")
		);
	}
	isIPv4MappedAddress(): boolean {
		return (
			this.parts[0] === 0 &&
			this.parts[1] === 0 &&
			this.parts[2] === 0 &&
			this.parts[3] === 0 &&
			this.parts[4] === 0 &&
			this.parts[5] === 0xffff
		);
	}
	match(
		other: IPv4 | IPv6 | [IPv4 | IPv6, number],
		cidrRange?: number
	): boolean {
		if (Array.isArray(other)) {
			cidrRange = other[1];
			other = other[0];
		}
		if (other.kind() === "ipv6") {
			return matchCIDR(this.parts, (other as IPv6).parts, 16, cidrRange ?? 128);
		}
		if (other.kind() === "ipv4" && this.isIPv4MappedAddress()) {
			return matchCIDR(
				[
					(this.parts[6] >> 8) & 0xff,
					this.parts[6] & 0xff,
					(this.parts[7] >> 8) & 0xff,
					this.parts[7] & 0xff,
				],
				(other as IPv4).octets,
				8,
				cidrRange ?? 32
			);
		}
		return false;
	}
	range(): string {
		return subnetMatch(this, IPv6.SpecialRanges);
	}
	subnetMatch(rangeList: RangeList<IPv6>, defaultName?: string): string {
		return subnetMatch(this, rangeList, defaultName);
	}
	toIPv4Address(): IPv4 {
		if (!this.isIPv4MappedAddress()) {
			throw new Error("ipaddr polyfill: not an IPv4-mapped IPv6 address");
		}
		return new IPv4([
			(this.parts[6] >> 8) & 0xff,
			this.parts[6] & 0xff,
			(this.parts[7] >> 8) & 0xff,
			this.parts[7] & 0xff,
		]);
	}
	static parse(addr: string): IPv6 {
		let zoneId: string | undefined;
		const zoneIndex = addr.indexOf("%");
		if (zoneIndex !== -1) {
			zoneId = addr.substring(zoneIndex + 1);
			addr = addr.substring(0, zoneIndex);
		}
		const expanded = expandIPv6(addr, 8);
		if (!expanded) throw new Error("ipaddr polyfill: invalid IPv6");
		return new IPv6(expanded.parts, zoneId);
	}
	static parseCIDR(addr: string): [IPv6, number] {
		const match = addr.match(/^(.+)\/(\d+)$/);
		if (!match) throw new Error("ipaddr polyfill: invalid IPv6 CIDR");
		const maskLength = parseInt(match[2]);
		if (maskLength < 0 || maskLength > 128)
			throw new Error("ipaddr polyfill: invalid mask length");
		return [IPv6.parse(match[1]), maskLength];
	}
	static isValid(addr: string): boolean {
		try {
			IPv6.parse(addr);
			return true;
		} catch {
			return false;
		}
	}
	static isValidCIDR(addr: string): boolean {
		try {
			IPv6.parseCIDR(addr);
			return true;
		} catch {
			return false;
		}
	}
	static SpecialRanges: RangeList<IPv6> = {
		unspecified: [[new IPv6(new Array(8).fill(0)), 128]],
		loopback: [[new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128]],
		multicast: [[new IPv6([0xff00, 0, 0, 0, 0, 0, 0, 0]), 8]],
		linkLocal: [[new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0]), 10]],
		uniqueLocal: [[new IPv6([0xfc00, 0, 0, 0, 0, 0, 0, 0]), 7]],
		ipv4Mapped: [[new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96]],
		rfc6145: [[new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96]],
		rfc6052: [[new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 96]],
		as112v6: [[new IPv6([0, 0, 0, 0, 192, 0, 0, 0]), 96]],
		orchid2: [[new IPv6([0x3fff, 0, 0, 0, 0, 0, 0, 0]), 16]],
		droneRemoteIdProtocolEntityTags: [
			[new IPv6([0x1234, 0, 0, 0, 0, 0, 0, 0]), 16],
		],
	};
}

export const Address = {
	IPv4,
	IPv6,
	fromByteArray(bytes: number[]): IPv4 | IPv6 {
		if (bytes.length === 4) return new IPv4(bytes);
		if (bytes.length === 16) {
			const parts: number[] = [];
			for (let i = 0; i < 16; i += 2)
				parts.push((bytes[i] << 8) + bytes[i + 1]);
			return new IPv6(parts);
		}
		throw new Error("ipaddr polyfill: invalid byte array length");
	},
	isValid(addr: string): boolean {
		return IPv4.isValid(addr) || IPv6.isValid(addr);
	},
	isValidCIDR(addr: string): boolean {
		return IPv4.isValidCIDR(addr) || IPv6.isValidCIDR(addr);
	},
	parse(addr: string): IPv4 | IPv6 {
		if (IPv4.isValid(addr)) return IPv4.parse(addr);
		if (IPv6.isValid(addr)) return IPv6.parse(addr);
		throw new Error("ipaddr polyfill: invalid IP address");
	},
	parseCIDR(addr: string): [IPv4 | IPv6, number] {
		if (IPv4.isValidCIDR(addr)) return IPv4.parseCIDR(addr);
		if (IPv6.isValidCIDR(addr)) return IPv6.parseCIDR(addr);
		throw new Error("ipaddr polyfill: invalid CIDR address");
	},
	process(addr: string): IPv4 | IPv6 {
		return Address.parse(addr);
	},
	subnetMatch<T extends IP>(
		addr: T,
		rangeList: RangeList<T>,
		defaultName?: string
	): string {
		return subnetMatch(addr, rangeList, defaultName);
	},
};

export default Address;
