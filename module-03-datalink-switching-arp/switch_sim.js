/**
 * Module 03 — JS/Node port of switch_sim.py. Same CAM-table learning,
 * flooding, and VLAN isolation logic, using Buffer instead of struct.
 * Compare this file to switch_sim.py line by line -- the ALGORITHM
 * (learn source, flood unknown/broadcast within VLAN, forward known
 * unicast to one port) is identical; only the byte-layout API differs.
 */

const BROADCAST = Buffer.from("ffffffffffff", "hex");

function macStr(buf) {
  return buf.toString("hex").match(/../g).join(":");
}

function ipToBytes(ip) {
  return Buffer.from(ip.split(".").map(Number));
}

function ipStr(buf) {
  return Array.from(buf).join(".");
}

// --------------------------------------------------------------- frames --
function buildFrame(dstMac, srcMac, ethertype, payload, vlanId = null) {
  if (vlanId !== null) {
    const tag = Buffer.alloc(4);
    tag.writeUInt16BE(0x8100, 0);
    tag.writeUInt16BE(vlanId & 0x0fff, 2);
    const etBuf = Buffer.alloc(2);
    etBuf.writeUInt16BE(ethertype, 0);
    return Buffer.concat([dstMac, srcMac, tag, etBuf, payload]);
  }
  const etBuf = Buffer.alloc(2);
  etBuf.writeUInt16BE(ethertype, 0);
  return Buffer.concat([dstMac, srcMac, etBuf, payload]);
}

function parseFrame(frame) {
  const dst = frame.subarray(0, 6);
  const src = frame.subarray(6, 12);
  let idx = 12;
  let vlanId = null;
  let ethertype = frame.readUInt16BE(idx);
  if (ethertype === 0x8100) {
    const tci = frame.readUInt16BE(idx + 2);
    vlanId = tci & 0x0fff;
    idx += 4;
    ethertype = frame.readUInt16BE(idx);
  }
  idx += 2;
  return { dst, src, ethertype, vlanId, payload: frame.subarray(idx) };
}

// ----------------------------------------------------------------- ARP --
const ETHERTYPE_ARP = 0x0806;
const ARP_REQUEST = 1;
const ARP_REPLY = 2;

function buildArp(op, senderMac, senderIp, targetMac, targetIp) {
  const buf = Buffer.alloc(28);
  buf.writeUInt16BE(1, 0); // htype: Ethernet
  buf.writeUInt16BE(0x0800, 2); // ptype: IPv4
  buf.writeUInt8(6, 4); // hlen
  buf.writeUInt8(4, 5); // plen
  buf.writeUInt16BE(op, 6);
  senderMac.copy(buf, 8);
  ipToBytes(senderIp).copy(buf, 14);
  targetMac.copy(buf, 18);
  ipToBytes(targetIp).copy(buf, 24);
  return buf;
}

function parseArp(payload) {
  return {
    op: payload.readUInt16BE(6),
    senderMac: Buffer.from(payload.subarray(8, 14)),
    senderIp: ipStr(payload.subarray(14, 18)),
    targetMac: Buffer.from(payload.subarray(18, 24)),
    targetIp: ipStr(payload.subarray(24, 28)),
  };
}

// ------------------------------------------------------------- Switch ---
class Switch {
  constructor(portVlan) {
    this.portVlan = portVlan; // Map<port, vlanId>
    this.camTable = new Map(); // key `${vlan}|${mac.hex}` -> port ('|' since MACs contain ':')
    this.hosts = new Map(); // port -> Host
  }

  connect(port, host) {
    this.hosts.set(port, host);
    host.attach(this, port);
  }

  dumpCamTable() {
    console.log("  CAM table:");
    if (this.camTable.size === 0) {
      console.log("    (empty)");
      return;
    }
    for (const [key, port] of this.camTable) {
      const [vlan, mac] = key.split("|");
      console.log(`    VLAN ${vlan.padEnd(3)} ${mac} -> port ${port}`);
    }
  }

  receive(inPort, frameBytes) {
    const parsed = parseFrame(frameBytes);
    const vlan = parsed.vlanId !== null ? parsed.vlanId : this.portVlan.get(inPort);

    const key = `${vlan}|${macStr(parsed.src)}`;
    const learnedBefore = this.camTable.has(key);
    this.camTable.set(key, inPort);
    if (!learnedBefore) {
      console.log(`    [switch] learned ${macStr(parsed.src)} is on port ${inPort} (VLAN ${vlan})`);
    }

    if (parsed.dst.equals(BROADCAST)) {
      console.log(`    [switch] broadcast frame on VLAN ${vlan} -> flooding to VLAN ${vlan} ports only`);
      this._flood(inPort, vlan, frameBytes);
      return;
    }

    const dstKey = `${vlan}|${macStr(parsed.dst)}`;
    if (this.camTable.has(dstKey)) {
      const outPort = this.camTable.get(dstKey);
      console.log(`    [switch] known unicast ${macStr(parsed.dst)} -> forwarding to port ${outPort} ONLY`);
      this._deliver(outPort, frameBytes);
    } else {
      console.log(`    [switch] unknown unicast ${macStr(parsed.dst)} -> flooding VLAN ${vlan} (like broadcast)`);
      this._flood(inPort, vlan, frameBytes);
    }
  }

  _flood(inPort, vlan, frameBytes) {
    for (const [port, portVlan] of this.portVlan) {
      if (port !== inPort && portVlan === vlan) {
        this._deliver(port, frameBytes);
      }
    }
  }

  _deliver(port, frameBytes) {
    const host = this.hosts.get(port);
    if (host) host.receive(frameBytes);
  }
}

// --------------------------------------------------------------- Host ---
class Host {
  constructor(name, macHex, ip) {
    this.name = name;
    this.mac = Buffer.from(macHex.replace(/:/g, ""), "hex");
    this.ip = ip;
    this.arpCache = new Map();
    this.switch = null;
    this.port = null;
  }

  attach(sw, port) {
    this.switch = sw;
    this.port = port;
  }

  send(frameBytes) {
    this.switch.receive(this.port, frameBytes);
  }

  arpRequest(targetIp, vlanId = null) {
    console.log(`  ${this.name}: "who has ${targetIp}? tell ${this.ip}" (broadcast)`);
    const payload = buildArp(ARP_REQUEST, this.mac, this.ip, Buffer.alloc(6), targetIp);
    const frame = buildFrame(BROADCAST, this.mac, ETHERTYPE_ARP, payload, vlanId);
    this.send(frame);
  }

  receive(frameBytes) {
    const parsed = parseFrame(frameBytes);
    if (!parsed.dst.equals(this.mac) && !parsed.dst.equals(BROADCAST)) return;
    if (parsed.ethertype === ETHERTYPE_ARP) this._handleArp(parsed);
  }

  _handleArp(parsed) {
    const arp = parseArp(parsed.payload);
    if (arp.op === ARP_REQUEST && arp.targetIp === this.ip) {
      console.log(`  ${this.name}: that's me -- replying "${this.ip} is at ${macStr(this.mac)}"`);
      const replyPayload = buildArp(ARP_REPLY, this.mac, this.ip, arp.senderMac, arp.senderIp);
      const replyFrame = buildFrame(arp.senderMac, this.mac, ETHERTYPE_ARP, replyPayload, parsed.vlanId);
      this.send(replyFrame);
    } else if (arp.op === ARP_REPLY && !this.arpCache.has(arp.senderIp)) {
      this.arpCache.set(arp.senderIp, arp.senderMac);
      console.log(`  ${this.name}: got ARP reply, caching ${arp.senderIp} -> ${macStr(arp.senderMac)}`);
    }
  }
}

function main() {
  console.log("Building a 4-port switch: ports 1,2 on VLAN 10; ports 3,4 on VLAN 20\n");
  const portVlan = new Map([[1, 10], [2, 10], [3, 20], [4, 20]]);
  const sw = new Switch(portVlan);

  const pcA = new Host("PC-A", "de:ad:be:ef:10:01", "192.0.2.11");
  const pcB = new Host("PC-B", "de:ad:be:ef:10:02", "192.0.2.12");
  const pcC = new Host("PC-C", "de:ad:be:ef:20:01", "192.0.2.21");
  const pcD = new Host("PC-D", "de:ad:be:ef:20:02", "192.0.2.22");

  sw.connect(1, pcA);
  sw.connect(2, pcB);
  sw.connect(3, pcC);
  sw.connect(4, pcD);

  console.log("=".repeat(70));
  console.log("SCENARIO 1: PC-A ARPs for PC-B -- both on VLAN 10");
  console.log("=".repeat(70));
  pcA.arpRequest(pcB.ip);
  console.log();
  sw.dumpCamTable();
  console.log("  PC-A's ARP cache:", Object.fromEntries([...pcA.arpCache].map(([k, v]) => [k, macStr(v)])));

  console.log();
  console.log("=".repeat(70));
  console.log("SCENARIO 2: PC-A ARPs for PC-C's IP -- PC-C is on VLAN 20 (isolated)");
  console.log("=".repeat(70));
  pcA.arpRequest(pcC.ip);
  console.log("  PC-A's ARP cache after:", Object.fromEntries([...pcA.arpCache].map(([k, v]) => [k, macStr(v)])));
  console.log("  Notice: no reply logged above -- same VLAN-isolation result as Python.");

  console.log();
  console.log("=".repeat(70));
  console.log("SCENARIO 3: PC-A sends a second frame to PC-B -- now a KNOWN unicast");
  console.log("=".repeat(70));
  const unicastPayload = Buffer.from("hello PC-B, this is a normal (non-ARP) frame");
  const frame = buildFrame(pcB.mac, pcA.mac, 0x0810, unicastPayload);
  pcA.send(frame);
}

main();
