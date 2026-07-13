/**
 * Module 09 — JS/Node port of lab_plan_generator.py. Same 3-VLAN plan,
 * same packing strategy (largest segment first, same as Module 04's
 * vlsmAllocate), same firewall-rule outline.
 */

function ipToInt(ip) {
  const o = ip.split(".").map(Number);
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

function intToIp(n) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 0xff).join(".");
}

function prefixToMaskInt(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

function subnetInfo(cidr) {
  const [ipStr, prefixStr] = cidr.split("/");
  const prefix = Number(prefixStr);
  const maskInt = prefixToMaskInt(prefix);
  const networkInt = (ipToInt(ipStr) & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const usable = Math.max(Math.pow(2, 32 - prefix) - 2, 0);
  return {
    cidr: `${intToIp(networkInt)}/${prefix}`,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: usable ? intToIp(networkInt + 1) : null,
    lastHost: usable ? intToIp(broadcastInt - 1) : null,
    usableHosts: usable,
    prefix,
  };
}

function smallestPrefixFor(hostCount) {
  const needed = hostCount + 2;
  let prefix = 32;
  while (Math.pow(2, 32 - prefix) < needed) prefix -= 1;
  return prefix;
}

function buildPlan(baseCidr, segments) {
  const [baseIpStr, basePrefixStr] = baseCidr.split("/");
  const basePrefix = Number(basePrefixStr);
  const baseNetwork = (ipToInt(baseIpStr) & prefixToMaskInt(basePrefix)) >>> 0;
  const end = baseNetwork + Math.pow(2, 32 - basePrefix);

  const ordered = [...segments].sort((a, b) => b[2] - a[2]);
  let cursor = baseNetwork;
  const plan = [];

  for (const [name, vlanId, hostCount] of ordered) {
    const prefix = smallestPrefixFor(hostCount);
    const blockSize = Math.pow(2, 32 - prefix);
    if (cursor % blockSize !== 0) {
      cursor += blockSize - (cursor % blockSize);
    }
    if (cursor + blockSize > end) {
      throw new Error(`${baseCidr} is too small to fit '${name}' needing ${hostCount} hosts`);
    }
    const cidr = `${intToIp(cursor)}/${prefix}`;
    plan.push({ name, vlanId, hostCount, ...subnetInfo(cidr) });
    cursor += blockSize;
  }

  return plan.sort((a, b) => a.vlanId - b.vlanId);
}

function printPlan(plan) {
  console.log("VLAN plan:");
  for (const seg of plan) {
    console.log(
      `  VLAN ${String(seg.vlanId).padEnd(4)} ${seg.name.padEnd(12)} ${seg.cidr.padEnd(18)} ` +
      `(${seg.usableHosts} usable, needed ${seg.hostCount})`
    );
  }

  console.log("\nFirewall rule outline (isolation goals from home_lab_design.md):");
  const byName = Object.fromEntries(plan.map((s) => [s.name, s]));
  if (byName["Main"] && byName["Lab"]) {
    console.log(`  ALLOW  ${byName["Main"].cidr} -> ${byName["Lab"].cidr}   (you administering your lab)`);
    console.log(`  BLOCK  ${byName["Lab"].cidr} -> ${byName["Main"].cidr}   (a compromised lab VM can't reach your devices)`);
  }
  if (byName["IoT/Guest"]) {
    for (const other of plan) {
      if (other.name !== "IoT/Guest") {
        console.log(`  BLOCK  ${byName["IoT/Guest"].cidr} -> ${other.cidr}   (isolate IoT/guest from everything else)`);
      }
    }
    console.log(`  ALLOW  ${byName["IoT/Guest"].cidr} -> 0.0.0.0/0   (internet access only)`);
  }
}

function main() {
  const baseCidr = process.argv[2] || "192.168.0.0/24";
  console.log(`Base network: ${baseCidr}\n`);

  const segments = [
    ["Main", 10, 20],
    ["IoT/Guest", 20, 30],
    ["Lab", 30, 10],
  ];
  const plan = buildPlan(baseCidr, segments);
  printPlan(plan);
}

main();
