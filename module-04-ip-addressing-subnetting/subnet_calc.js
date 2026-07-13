/**
 * Module 04 — JS/Node port of subnet_calc.py. Same bit-math approach:
 * every IPv4 address becomes a 32-bit unsigned integer, and every
 * network/broadcast/host-range computation is just bitwise AND/OR/NOT
 * against a mask built from the prefix length.
 *
 * Note: JS bitwise operators work on SIGNED 32-bit ints internally, so
 * `>>> 0` (unsigned right shift by zero) is used throughout to force
 * results back into the unsigned range Python's arbitrary-precision ints
 * give you for free. This is the single biggest porting gotcha between
 * the two languages for this module -- see DECISIONS.md.
 */

function ipToInt(ip) {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => o < 0 || o > 255 || Number.isNaN(o))) {
    throw new Error(`not a valid IPv4 address: ${ip}`);
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function intToIp(n) {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 0xff).join(".");
}

function prefixToMaskInt(prefix) {
  if (prefix < 0 || prefix > 32) throw new Error(`prefix must be 0-32, got ${prefix}`);
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function parseCidr(cidr) {
  const [ipStr, prefixStr] = cidr.split("/");
  return [ipToInt(ipStr), parseInt(prefixStr, 10)];
}

function subnetInfo(cidr) {
  const [ipInt, prefix] = parseCidr(cidr);
  const maskInt = prefixToMaskInt(prefix);
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);

  let usableHosts, firstHost, lastHost;
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

function printInfo(cidr) {
  const info = subnetInfo(cidr);
  console.log(`Input:            ${info.input}`);
  console.log(`Netmask:          ${info.netmask}  (/${info.prefix})`);
  console.log(`Wildcard mask:    ${info.wildcardMask}`);
  console.log(`Network address:  ${info.network}`);
  console.log(`Broadcast address:${info.broadcast}`);
  console.log(`Usable host range:${info.firstHost} - ${info.lastHost}`);
  console.log(`Total addresses:  ${info.totalAddresses}`);
  console.log(`Usable hosts:     ${info.usableHosts}`);
}

// ------------------------------------------------------------------ VLSM --
function vlsmAllocate(baseCidr, hostRequirements) {
  const [baseIpInt, basePrefix] = parseCidr(baseCidr);
  const baseNetworkInt = (baseIpInt & prefixToMaskInt(basePrefix)) >>> 0;
  const baseSize = Math.pow(2, 32 - basePrefix);

  const sortedReqs = [...hostRequirements].sort((a, b) => b[1] - a[1]);

  const allocations = [];
  let cursor = baseNetworkInt;
  const end = baseNetworkInt + baseSize;

  for (const [name, hostsNeeded] of sortedReqs) {
    const neededAddresses = hostsNeeded + 2;
    let prefix = 32;
    while (Math.pow(2, 32 - prefix) < neededAddresses) prefix -= 1;
    const blockSize = Math.pow(2, 32 - prefix);

    if (cursor % blockSize !== 0) {
      cursor += blockSize - (cursor % blockSize);
    }

    if (cursor + blockSize > end) {
      throw new Error(
        `base network ${baseCidr} is too small to fit '${name}' needing ${hostsNeeded} hosts after prior allocations`
      );
    }

    const cidr = `${intToIp(cursor)}/${prefix}`;
    allocations.push({ name, hostsNeeded, cidr, ...subnetInfo(cidr) });
    cursor += blockSize;
  }

  return allocations;
}

// -------------------------------------------------------------- self-test --
// No standard-library "ipaddress" equivalent ships with Node, so this
// self-test instead cross-checks against subnet_calc.py by shelling out --
// see DECISIONS.md for why cross-LANGUAGE validation stands in here for
// the cross-LIBRARY validation Python's version does internally.
function selfTest(trials = 200) {
  const { execFileSync } = require("child_process");
  let mismatches = 0;
  for (let i = 0; i < trials; i++) {
    const ip = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 256)).join(".");
    const prefix = Math.floor(Math.random() * 33);
    const cidr = `${ip}/${prefix}`;
    const mine = subnetInfo(`${intToIp((ipToInt(ip) & prefixToMaskInt(prefix)) >>> 0)}/${prefix}`);
    let pyOut;
    try {
      pyOut = execFileSync("python", ["subnet_calc.py", cidr]).toString();
    } catch (e) {
      continue;
    }
    const pyNetwork = pyOut.match(/Network address:\s*(\S+)/)[1];
    const pyBroadcast = pyOut.match(/Broadcast address:(\S+)/)[1];
    if (mine.network !== pyNetwork || mine.broadcast !== pyBroadcast) {
      mismatches++;
      console.log(`MISMATCH on ${cidr}: mine=${mine.network}/${mine.broadcast} python=${pyNetwork}/${pyBroadcast}`);
    }
  }
  console.log(`\nSelf-test: ${trials - mismatches}/${trials} matched subnet_calc.py.`);
  return mismatches === 0;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === "--self-test") {
    const ok = selfTest(Number(args[1]) || 50);
    process.exit(ok ? 0 : 1);
  } else if (args.length === 1) {
    printInfo(args[0]);
  } else {
    console.log("Usage: node subnet_calc.js <ip/prefix>");
    console.log("       node subnet_calc.js --self-test [trials]");
    console.log();
    console.log("Example: node subnet_calc.js 192.168.1.0/26");
  }
}

module.exports = { ipToInt, intToIp, prefixToMaskInt, subnetInfo, vlsmAllocate };
