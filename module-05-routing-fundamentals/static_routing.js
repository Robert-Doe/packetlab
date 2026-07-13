/**
 * Module 05 — JS/Node port of static_routing.py. Same topology, same
 * longest-prefix-match algorithm, same 4 trace scenarios.
 */

function ipToInt(ip) {
  const o = ip.split(".").map(Number);
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

function prefixToMaskInt(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

class Router {
  constructor(name) {
    this.name = name;
    this.routes = [];
    this.ownIps = new Set();
  }

  addInterface(ip) {
    this.ownIps.add(ip);
  }

  addConnectedRoute(cidr, iface) {
    const [networkStr, prefix] = cidr.split("/");
    this.routes.push({
      cidr, networkInt: ipToInt(networkStr), prefix: Number(prefix),
      nextHop: null, iface, connected: true,
    });
  }

  addStaticRoute(cidr, nextHop, iface) {
    const [networkStr, prefix] = cidr.split("/");
    this.routes.push({
      cidr, networkInt: ipToInt(networkStr), prefix: Number(prefix),
      nextHop, iface, connected: false,
    });
  }

  lookup(destIp) {
    const destInt = ipToInt(destIp);
    const candidates = this.routes.filter((r) => {
      const mask = prefixToMaskInt(r.prefix);
      return (destInt & mask) >>> 0 === (r.networkInt & mask) >>> 0;
    });
    if (candidates.length === 0) return null;
    return candidates.reduce((best, r) => (r.prefix > best.prefix ? r : best));
  }

  printTable() {
    console.log(`  ${this.name} routing table:`);
    const sorted = [...this.routes].sort((a, b) => b.prefix - a.prefix);
    for (const r of sorted) {
      const via = r.connected ? "directly connected" : `via ${r.nextHop}`;
      console.log(`    ${r.cidr.padEnd(18)} ${via.padEnd(28)} iface ${r.iface}`);
    }
  }
}

function buildTopology() {
  const r1 = new Router("R1");
  const r2 = new Router("R2");
  const r3 = new Router("R3");

  r1.addInterface("192.0.2.1");
  r1.addInterface("10.0.12.1");
  r2.addInterface("10.0.12.2");
  r2.addInterface("10.0.23.1");
  r3.addInterface("10.0.23.2");
  r3.addInterface("198.51.100.1");

  r1.addConnectedRoute("192.0.2.0/24", "eth0");
  r1.addConnectedRoute("10.0.12.0/30", "eth1");
  r1.addStaticRoute("198.51.100.0/24", "10.0.12.2", "eth1");
  r1.addStaticRoute("0.0.0.0/0", "203.0.113.1", "eth2");

  r2.addConnectedRoute("10.0.12.0/30", "eth0");
  r2.addConnectedRoute("10.0.23.0/30", "eth1");
  r2.addStaticRoute("192.0.2.0/24", "10.0.12.1", "eth0");
  r2.addStaticRoute("198.51.100.0/24", "10.0.23.2", "eth1");

  r3.addConnectedRoute("10.0.23.0/30", "eth0");
  r3.addConnectedRoute("198.51.100.0/24", "eth1");
  r3.addStaticRoute("192.0.2.0/24", "10.0.23.1", "eth0");

  const routers = { R1: r1, R2: r2, R3: r3 };
  const ipOwner = {};
  for (const [name, r] of Object.entries(routers)) {
    for (const ip of r.ownIps) ipOwner[ip] = name;
  }
  return { routers, ipOwner };
}

function tracePacket(routers, ipOwner, startRouter, destIp) {
  console.log(`\nTracing a packet to ${destIp}, starting at ${startRouter}:`);
  let current = startRouter;
  const visited = new Set();
  while (true) {
    if (visited.has(current)) {
      console.log(`  ROUTING LOOP detected at ${current} -- stopping trace`);
      return;
    }
    visited.add(current);
    const router = routers[current];
    const route = router.lookup(destIp);
    if (route === null) {
      console.log(`  ${current}: no matching route -- packet DROPPED (destination unreachable)`);
      return;
    }
    console.log(`  ${current}: longest match is ${route.cidr} (${route.connected ? "connected" : "via " + route.nextHop})`);
    if (route.connected) {
      console.log(`  ${current}: destination is on a directly connected network -- DELIVERED via ${route.iface}`);
      return;
    }
    if (route.cidr === "0.0.0.0/0" && !(route.nextHop in ipOwner)) {
      console.log(`  ${current}: default route -- packet EXITS this topology toward ${route.nextHop} (the wider internet)`);
      return;
    }
    const nextRouter = ipOwner[route.nextHop];
    if (nextRouter === undefined) {
      console.log(`  ${current}: next hop ${route.nextHop} is outside this simulated topology -- packet EXITS here`);
      return;
    }
    current = nextRouter;
  }
}

function main() {
  const { routers, ipOwner } = buildTopology();
  for (const r of Object.values(routers)) {
    r.printTable();
    console.log();
  }

  tracePacket(routers, ipOwner, "R1", "198.51.100.20");
  tracePacket(routers, ipOwner, "R3", "192.0.2.10");
  tracePacket(routers, ipOwner, "R1", "8.8.8.8");
  tracePacket(routers, ipOwner, "R2", "203.0.113.55");
}

main();
