/**
 * subnet.ts, TypeScript port of module-04-ip-addressing-subnetting/subnet_calc.js
 * (itself a JS port of subnet_calc.py). Same bit-math approach: every IPv4
 * address becomes a 32-bit unsigned integer, and every network/broadcast/
 * host-range computation is plain bitwise AND/OR/NOT against a mask built
 * from the prefix length.
 *
 * JS/TS bitwise operators work on SIGNED 32-bit ints internally, so `>>> 0`
 * (unsigned right shift by zero) is used throughout to force results back
 * into the unsigned range, the same porting gotcha called out in the
 * original module's DECISIONS.md.
 */

export interface SubnetInfo {
  input: string;
  prefix: number;
  netmask: string;
  wildcardMask: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
}

export function ipToInt(ip: string): number {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => o < 0 || o > 255 || Number.isNaN(o))) {
    throw new Error(`not a valid IPv4 address: ${ip}`);
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 0xff).join(".");
}

export function prefixToMaskInt(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error(`prefix must be 0-32, got ${prefix}`);
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function parseCidr(cidr: string): [number, number] {
  const [ipStr, prefixStr] = cidr.split("/");
  if (!ipStr || prefixStr === undefined) {
    throw new Error(`expected "ip/prefix", got: ${cidr}`);
  }
  const prefix = parseInt(prefixStr, 10);
  if (Number.isNaN(prefix)) throw new Error(`prefix is not a number: ${prefixStr}`);
  return [ipToInt(ipStr), prefix];
}

export function subnetInfo(cidr: string): SubnetInfo {
  const [ipInt, prefix] = parseCidr(cidr);
  const maskInt = prefixToMaskInt(prefix);
  const wildcardInt = ~maskInt >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);

  let usableHosts: number;
  let firstHost: number;
  let lastHost: number;
  if (prefix === 32) {
    usableHosts = 1;
    firstHost = lastHost = networkInt;
  } else if (prefix === 31) {
    usableHosts = 2; // RFC 3021
    firstHost = networkInt;
    lastHost = broadcastInt;
  } else {
    usableHosts = totalAddresses - 2;
    firstHost = (networkInt + 1) >>> 0;
    lastHost = (broadcastInt - 1) >>> 0;
  }

  return {
    input: cidr,
    prefix,
    netmask: intToIp(maskInt),
    wildcardMask: intToIp(wildcardInt),
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    totalAddresses,
    usableHosts,
  };
}
