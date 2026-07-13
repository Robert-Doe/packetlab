/**
 * Module 10 — JS/Node port of nat_firewall_sim.py. Same PAT table, same
 * stateful connection tracking, same 4 scenarios.
 */

const EXTERNAL_IP = "203.0.113.7";

class NatFirewall {
  constructor(externalIp = EXTERNAL_IP) {
    this.externalIp = externalIp;
    this.nextExternalPort = 40000;
    this.natTable = new Map();   // `${ip}:${port}` -> externalPort
    this.reverseNat = new Map(); // `${extIp}:${extPort}` -> [ip, port]
    this.connState = new Map(); // `${ip}:${port}:${destIp}:${destPort}` -> state
  }

  outbound(internalIp, internalPort, destIp, destPort) {
    const key = `${internalIp}:${internalPort}`;
    const connKey = `${internalIp}:${internalPort}:${destIp}:${destPort}`;

    let extPort;
    if (!this.natTable.has(key)) {
      extPort = this.nextExternalPort++;
      this.natTable.set(key, extPort);
      this.reverseNat.set(`${this.externalIp}:${extPort}`, [internalIp, internalPort]);
    } else {
      extPort = this.natTable.get(key);
    }

    const isNew = !this.connState.has(connKey);

    console.log(`  OUTBOUND ${internalIp}:${internalPort} -> ${destIp}:${destPort}`);
    console.log(`    NAT:      translated source to ${this.externalIp}:${extPort}`);
    console.log(`    firewall: connection state = ${isNew ? "NEW (creating tracked entry)" : "already tracked"}`);

    if (isNew) {
      this.connState.set(connKey, "ESTABLISHED");
    }
    return [this.externalIp, extPort];
  }

  inbound(srcIp, srcPort, destIp, destPort) {
    console.log(`  INBOUND  ${srcIp}:${srcPort} -> ${destIp}:${destPort}`);

    const natKey = `${destIp}:${destPort}`;
    if (!this.reverseNat.has(natKey)) {
      console.log(`    NAT:      no entry for ${destIp}:${destPort} -- nowhere to translate this to`);
      console.log(`    firewall: DROPPED -- unsolicited inbound traffic with no matching internal host`);
      return null;
    }

    const [internalIp, internalPort] = this.reverseNat.get(natKey);
    const connKey = `${internalIp}:${internalPort}:${srcIp}:${srcPort}`;

    if (this.connState.get(connKey) !== "ESTABLISHED") {
      console.log(`    NAT:      would translate to ${internalIp}:${internalPort}, but...`);
      console.log(`    firewall: DROPPED -- no ESTABLISHED connection state matches this source`);
      return null;
    }

    console.log(`    NAT:      translated destination to ${internalIp}:${internalPort}`);
    console.log(`    firewall: ALLOWED -- matches ESTABLISHED connection state`);
    return [internalIp, internalPort];
  }
}

function main() {
  const nf = new NatFirewall();

  console.log("=".repeat(70));
  console.log("SCENARIO 1: two internal hosts browsing the web -- PAT in action");
  console.log("=".repeat(70));
  nf.outbound("192.168.1.10", 51000, "93.184.216.34", 443);
  console.log();
  nf.outbound("192.168.1.20", 51000, "93.184.216.34", 443);
  console.log();
  console.log("  Notice: both internal hosts used the SAME internal port (51000,");
  console.log("  a coincidence that happens constantly in practice) but got DIFFERENT");
  console.log(`  external ports, both behind the one external IP ${nf.externalIp}.`);
  console.log("  This is PAT: many internal (ip, port) pairs, one external IP,");
  console.log("  disambiguated entirely by external port.");

  console.log();
  console.log("=".repeat(70));
  console.log("SCENARIO 2: the web server's reply comes back -- allowed");
  console.log("=".repeat(70));
  nf.inbound("93.184.216.34", 443, nf.externalIp, 40000);

  console.log();
  console.log("=".repeat(70));
  console.log("SCENARIO 3: a random unsolicited inbound connection -- dropped");
  console.log("=".repeat(70));
  nf.inbound("198.51.100.99", 12345, nf.externalIp, 8080);
  console.log("  Nobody inside your network ever contacted 198.51.100.99, so there's");
  console.log("  no NAT entry and no connection state for this -- this is why port-");
  console.log("  scanning a home router from the internet finds almost everything");
  console.log("  closed: there's no 'server' listening, just a translation table that");
  console.log("  only has entries for conversations YOUR network started.");

  console.log();
  console.log("=".repeat(70));
  console.log("SCENARIO 4: an inbound packet claiming an existing port, wrong source");
  console.log("=".repeat(70));
  nf.inbound("198.51.100.99", 9999, nf.externalIp, 40000);
  console.log("  Same external port as Scenario 1's real entry, but from a DIFFERENT");
  console.log("  source than the one that entry's connection was established with --");
  console.log("  still dropped. The firewall checks the FULL connection tuple, not");
  console.log("  just 'is this port open in the NAT table.'");
}

main();
