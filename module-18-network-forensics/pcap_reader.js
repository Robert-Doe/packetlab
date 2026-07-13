/**
 * Module 18 — JS/Node port of pcap_reader.py. Same real pcap parsing.
 */
const fs = require("fs");

const PCAP_MAGIC = 0xa1b2c3d4;

function macStr(buf) {
  return buf.toString("hex").match(/../g).join(":");
}

function ipStr(buf) {
  return Array.from(buf).join(".");
}

function readPcap(path) {
  const data = fs.readFileSync(path);
  const magic = data.readUInt32BE(0);
  if (magic !== PCAP_MAGIC) {
    throw new Error(`not a recognized big-endian pcap file (magic=0x${magic.toString(16)})`);
  }
  const verMajor = data.readUInt16BE(4);
  const verMinor = data.readUInt16BE(6);
  const snaplen = data.readUInt32BE(16);
  const network = data.readUInt32BE(20);

  const packets = [];
  let offset = 24;
  while (offset + 16 <= data.length) {
    const tsSec = data.readUInt32BE(offset);
    const tsUsec = data.readUInt32BE(offset + 4);
    const inclLen = data.readUInt32BE(offset + 8);
    offset += 16;
    const frame = data.subarray(offset, offset + inclLen);
    offset += inclLen;
    packets.push({ ts: tsSec + tsUsec / 1_000_000, frame });
  }

  return { meta: { version: [verMajor, verMinor], snaplen, network }, packets };
}

function parseFrame(frame) {
  const dstMac = frame.subarray(0, 6);
  const srcMac = frame.subarray(6, 12);
  const ipHeader = frame.subarray(14, 34);
  const srcIp = ipHeader.subarray(12, 16);
  const dstIp = ipHeader.subarray(16, 20);

  const tcpHeader = frame.subarray(34, 54);
  const srcPort = tcpHeader.readUInt16BE(0);
  const dstPort = tcpHeader.readUInt16BE(2);
  const seq = tcpHeader.readUInt32BE(4);
  const ack = tcpHeader.readUInt32BE(8);
  const offsetFlags = tcpHeader.readUInt16BE(12);
  const tcpFlags = offsetFlags & 0x3f;
  const payload = frame.subarray(54);

  return {
    srcMac: macStr(srcMac), dstMac: macStr(dstMac),
    srcIp: ipStr(srcIp), dstIp: ipStr(dstIp),
    srcPort, dstPort, tcpFlags, seq, ack, payload,
  };
}

const FLAG_NAMES = { 0x02: "SYN", 0x10: "ACK", 0x18: "PSH,ACK", 0x12: "SYN,ACK", 0x01: "FIN", 0x04: "RST" };

function main() {
  const path = process.argv[2] || "incident_node.pcap";
  const { meta, packets } = readPcap(path);
  console.log(`pcap version ${JSON.stringify(meta.version)}, snaplen ${meta.snaplen}, linktype ${meta.network}`);
  console.log(`${packets.length} packets\n`);

  packets.forEach((pkt, i) => {
    const p = parseFrame(pkt.frame);
    const flags = FLAG_NAMES[p.tcpFlags] || `0x${p.tcpFlags.toString(16)}`;
    const payloadPreview = p.payload.subarray(0, 40);
    const idx = String(i).padStart(3, "0");
    let line = `#${idx} t=${pkt.ts.toFixed(3)} ${p.srcIp}:${p.srcPort} -> ${p.dstIp}:${p.dstPort} [${flags}] len=${p.payload.length}`;
    if (payloadPreview.length > 0) {
      line += ` payload=${JSON.stringify(payloadPreview.toString())}`;
    }
    console.log(line);
  });
}

if (require.main === module) {
  main();
}

module.exports = { readPcap, parseFrame };
