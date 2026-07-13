/**
 * Module 06 — JS/Node port of topology_validator.py. Same JSON topology
 * format, same longest-prefix-match logic, same ping-trace output shape.
 *
 * Usage:
 *   node topology_validator.js topology_configs/topology2_two_lans_one_hop.json
 *   node topology_validator.js topology_configs/topology3_three_router_chain.json
 */
const fs = require("fs");

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

function parseCidr(cidr) {
  const [ipStr, prefixStr] = cidr.split("/");
  return [ipStr, Number(prefixStr)];
}

class Router {
  constructor(name) {
    this.name = name;
    this.routes = [];
    this.ownIps = new Set();
  }

  addConnected(ipCidr, iface) {
    const [ipStr, prefix] = parseCidr(ipCidr);
    this.ownIps.add(ipStr);
    const networkInt = (ipToInt(ipStr) & prefixToMaskInt(prefix)) >>> 0;
    this.routes.push({
      cidr: `${intToIp(networkInt)}/${prefix}`, networkInt, prefix,
      nextHop: null, iface, connected: true,
    });
  }

  addStatic(cidr, nextHop) {
    const [networkStr, prefix] = parseCidr(cidr);
    this.routes.push({
      cidr, networkInt: ipToInt(networkStr), prefix,
      nextHop, iface: null, connected: false,
    });
  }

  lookup(destIp) {
    const destInt = ipToInt(destIp);
    const candidates = this.routes.filter((r) => {
      const mask = prefixToMaskInt(r.prefix);
      return ((destInt & mask) >>> 0) === ((r.networkInt & mask) >>> 0);
    });
    if (candidates.length === 0) return null;
    return candidates.reduce((best, r) => (r.prefix > best.prefix ? r : best));
  }

  showIpRoute() {
    console.log(`${this.name}# show ip route`);
    const sorted = [...this.routes].sort((a, b) => b.prefix - a.prefix);
    for (const r of sorted) {
      if (r.connected) {
        console.log(`C    ${r.cidr} is directly connected, ${r.iface}`);
      } else {
        console.log(`S    ${r.cidr} [1/0] via ${r.nextHop}`);
      }
    }
    console.log();
  }
}

function buildRouters(topology) {
  const routers = {};
  for (const [name, cfg] of Object.entries(topology.routers)) {
    const r = new Router(name);
    for (const [iface, ipCidr] of Object.entries(cfg.interfaces)) {
      r.addConnected(ipCidr, iface);
    }
    for (const sr of cfg.static_routes || []) {
      r.addStatic(sr.network, sr.next_hop);
    }
    routers[name] = r;
  }

  const ipOwner = {};
  for (const [name, r] of Object.entries(routers)) {
    for (const ip of r.ownIps) ipOwner[ip] = name;
  }

  const hostGateway = {};
  for (const [host, cfg] of Object.entries(topology.hosts || {})) {
    hostGateway[host] = cfg.gateway;
  }

  return { routers, ipOwner, hostGateway };
}

function tracePing(routers, ipOwner, hostGateway, srcHost, destIp) {
  console.log(`${srcHost}> ping ${destIp}`);
  const gatewayIp = hostGateway[srcHost];
  let current = ipOwner[gatewayIp];
  let hopCount = 0;
  const visited = new Set();

  while (true) {
    if (visited.has(current)) {
      console.log("  ROUTING LOOP -- Request timed out.");
      return;
    }
    visited.add(current);
    const router = routers[current];
    const route = router.lookup(destIp);
    hopCount++;
    if (route === null) {
      console.log(`  ${current}: no route -- Destination host unreachable.`);
      return;
    }
    if (route.connected) {
      console.log(`  hop ${hopCount}: ${current} (${route.iface}) -- delivered to directly connected network`);
      const approxRttMs = hopCount * 1;
      console.log(`  Reply from ${destIp}: bytes=32 time<${approxRttMs + 1}ms TTL=${64 - hopCount}`);
      return;
    }
    console.log(`  hop ${hopCount}: ${current} -> via ${route.nextHop} (${route.cidr})`);
    const nextRouter = ipOwner[route.nextHop];
    if (nextRouter === undefined) {
      console.log(`  hop ${hopCount}: ${route.nextHop} is outside this topology -- exits here`);
      return;
    }
    current = nextRouter;
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log("Usage: node topology_validator.js <topology.json>");
    process.exit(1);
  }

  const topology = JSON.parse(fs.readFileSync(args[0], "utf8"));
  console.log(`Topology: ${topology.description || args[0]}\n`);

  const { routers, ipOwner, hostGateway } = buildRouters(topology);

  console.log("=".repeat(70));
  console.log("Expected `show ip route` output for every router");
  console.log("=".repeat(70));
  for (const r of Object.values(routers)) r.showIpRoute();

  console.log("=".repeat(70));
  console.log("Expected ping results");
  console.log("=".repeat(70));
  for (const test of topology.pings_to_test || []) {
    tracePing(routers, ipOwner, hostGateway, test.from, test.to);
    console.log();
  }
}

main();
