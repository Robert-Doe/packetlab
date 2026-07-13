/**
 * Module 18 — JS/Node port of incident_timeline.py. Same recon/exploit/
 * exfiltration detection and chronological reconstruction.
 */
const { readPcap, parseFrame } = require("./pcap_reader.js");

const KNOWN_BAD_PAYLOADS = new Map([
  ["smiley:)", "vsftpd 2.3.4 backdoor trigger string (CVE-2011-2523, same CVE as Module 16's database)"],
]);

function annotatePacket(parsed) {
  const payloadStr = parsed.payload.toString();
  for (const [pattern, description] of KNOWN_BAD_PAYLOADS) {
    if (payloadStr.includes(pattern)) {
      return `EXPLOIT ATTEMPT -- payload matches known-bad pattern: ${description}`;
    }
  }
  return null;
}

function detectRecon(packetsParsed, windowSeconds = 1.0, minPorts = 4) {
  const bySrcDst = new Map();
  for (const [ts, p] of packetsParsed) {
    if (p.tcpFlags === 0x02) {
      const key = `${p.srcIp}|${p.dstIp}`;
      if (!bySrcDst.has(key)) bySrcDst.set(key, []);
      bySrcDst.get(key).push([ts, p.dstPort]);
    }
  }

  const findings = [];
  for (const [key, events] of bySrcDst) {
    const [src, dst] = key.split("|");
    events.sort((a, b) => a[0] - b[0]);
    const ports = new Set(events.filter(([ts]) => ts - events[0][0] <= windowSeconds).map(([, port]) => port));
    if (ports.size >= minPorts) {
      findings.push({ type: "reconnaissance", src, dst, portsTouched: [...ports].sort((a, b) => a - b), startTs: events[0][0] });
    }
  }
  return findings;
}

function detectExfiltration(packetsParsed, minPackets = 10) {
  const bySrcDstPort = new Map();
  for (const [ts, p] of packetsParsed) {
    if (p.payload.length > 0) {
      const key = `${p.srcIp}|${p.dstIp}|${p.dstPort}`;
      if (!bySrcDstPort.has(key)) bySrcDstPort.set(key, []);
      bySrcDstPort.get(key).push([ts, p.payload.length]);
    }
  }

  const findings = [];
  for (const [key, events] of bySrcDstPort) {
    if (events.length >= minPackets) {
      const [src, dst, port] = key.split("|");
      const totalBytes = events.reduce((sum, [, size]) => sum + size, 0);
      findings.push({ type: "exfiltration", src, dst, port: Number(port), packetCount: events.length, totalBytes, startTs: events[0][0] });
    }
  }
  return findings;
}

function buildTimeline(path) {
  const { packets } = readPcap(path);
  const packetsParsed = packets.map((pkt) => [pkt.ts, parseFrame(pkt.frame)]);

  const events = [];

  for (const f of detectRecon(packetsParsed)) {
    events.push([f.startTs, `RECONNAISSANCE: ${f.src} scanned ${f.portsTouched.length} ` +
      `ports on ${f.dst} ([${f.portsTouched.join(", ")}])`]);
  }

  for (const [ts, p] of packetsParsed) {
    const note = annotatePacket(p);
    if (note) {
      events.push([ts, `${p.srcIp}:${p.srcPort} -> ${p.dstIp}:${p.dstPort} -- ${note}`]);
    }
  }

  for (const f of detectExfiltration(packetsParsed)) {
    if (f.dst !== "10.0.0.50") {
      events.push([f.startTs, `EXFILTRATION: ${f.src} sent ${f.packetCount} packets ` +
        `(${f.totalBytes} bytes) to ${f.dst}:${f.port} -- likely data exfiltration to an external host`]);
    }
  }

  events.sort((a, b) => a[0] - b[0]);
  return events;
}

function main() {
  const path = process.argv[2] || "incident_node.pcap";
  const events = buildTimeline(path);
  console.log(`Incident timeline reconstructed from ${path}:\n`);
  const t0 = events.length > 0 ? events[0][0] : 0;
  for (const [ts, description] of events) {
    console.log(`[T+${(ts - t0).toFixed(2).padStart(7)}s] ${description}`);
  }
}

main();
