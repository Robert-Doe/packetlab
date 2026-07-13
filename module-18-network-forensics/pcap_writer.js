/**
 * Module 18 — JS/Node port of pcap_writer.py. Same real, valid libpcap
 * file format, same synthetic incident (recon -> exploit -> exfiltration).
 */
const fs = require("fs");

const PCAP_MAGIC = 0xa1b2c3d4;

function ipToBytes(ip) {
  return Buffer.from(ip.split(".").map(Number));
}

function checksum16(buf) {
  let data = buf;
  if (data.length % 2 !== 0) data = Buffer.concat([data, Buffer.from([0])]);
  let total = 0;
  for (let i = 0; i < data.length; i += 2) total += data.readUInt16BE(i);
  while (total >> 16) total = (total & 0xffff) + (total >> 16);
  return ~total & 0xffff;
}

function buildFrame(srcMac, dstMac, srcIp, dstIp, srcPort, dstPort, flags, payload, seq = 1000, ack = 0) {
  const eth = Buffer.alloc(14);
  Buffer.from(dstMac.replace(/:/g, ""), "hex").copy(eth, 0);
  Buffer.from(srcMac.replace(/:/g, ""), "hex").copy(eth, 6);
  eth.writeUInt16BE(0x0800, 12);

  const tcp = Buffer.alloc(20 + payload.length);
  tcp.writeUInt16BE(srcPort, 0);
  tcp.writeUInt16BE(dstPort, 2);
  tcp.writeUInt32BE(seq, 4);
  tcp.writeUInt32BE(ack, 8);
  tcp.writeUInt16BE((5 << 12) | flags, 12);
  tcp.writeUInt16BE(64240, 14);
  tcp.writeUInt16BE(0, 16);
  tcp.writeUInt16BE(0, 18);
  payload.copy(tcp, 20);

  const ipNoCsum = Buffer.alloc(20);
  ipNoCsum.writeUInt8(0x45, 0);
  ipNoCsum.writeUInt8(0, 1);
  ipNoCsum.writeUInt16BE(20 + tcp.length, 2);
  ipNoCsum.writeUInt16BE(0x1c46, 4);
  ipNoCsum.writeUInt16BE(0x4000, 6);
  ipNoCsum.writeUInt8(64, 8);
  ipNoCsum.writeUInt8(6, 9);
  ipNoCsum.writeUInt16BE(0, 10);
  ipToBytes(srcIp).copy(ipNoCsum, 12);
  ipToBytes(dstIp).copy(ipNoCsum, 16);

  const ipCsum = checksum16(ipNoCsum);
  const ip = Buffer.from(ipNoCsum);
  ip.writeUInt16BE(ipCsum, 10);

  return Buffer.concat([eth, ip, tcp]);
}

function writePcap(path, packets) {
  const globalHeader = Buffer.alloc(24);
  globalHeader.writeUInt32BE(PCAP_MAGIC, 0);
  globalHeader.writeUInt16BE(2, 4);
  globalHeader.writeUInt16BE(4, 6);
  globalHeader.writeInt32BE(0, 8);
  globalHeader.writeUInt32BE(0, 12);
  globalHeader.writeUInt32BE(65535, 16);
  globalHeader.writeUInt32BE(1, 20);

  const chunks = [globalHeader];
  for (const [ts, frame] of packets) {
    const tsSec = Math.floor(ts);
    const tsUsec = Math.round((ts - tsSec) * 1_000_000);
    const recordHeader = Buffer.alloc(16);
    recordHeader.writeUInt32BE(tsSec, 0);
    recordHeader.writeUInt32BE(tsUsec, 4);
    recordHeader.writeUInt32BE(frame.length, 8);
    recordHeader.writeUInt32BE(frame.length, 12);
    chunks.push(recordHeader, frame);
  }
  fs.writeFileSync(path, Buffer.concat(chunks));
}

function buildIncident() {
  const attackerMac = "aa:bb:cc:00:00:66", attackerIp = "203.0.113.66";
  const victimMac = "aa:bb:cc:00:00:50", victimIp = "10.0.0.50";
  const exfilMac = "aa:bb:cc:00:00:99", exfilIp = "203.0.113.99";

  const packets = [];
  let t = 1700000000.0;

  for (const port of [21, 22, 80, 443, 3306, 8080]) {
    t += 0.05;
    packets.push([t, buildFrame(attackerMac, victimMac, attackerIp, victimIp, 40000 + port, port, 0x02, Buffer.alloc(0))]);
  }

  t += 5.0;
  packets.push([t, buildFrame(attackerMac, victimMac, attackerIp, victimIp, 40021, 21, 0x18, Buffer.from("USER smiley:)\r\n"))]);

  t += 0.2;
  packets.push([t, buildFrame(victimMac, attackerMac, victimIp, attackerIp, 21, 40021, 0x18, Buffer.from("220 (vsftpd 2.3.4)\r\n"))]);

  t += 30.0;
  const exfilPayload = Buffer.concat([Buffer.from("CUSTOMER_DATA:"), Buffer.alloc(1400, "A")]);
  for (let i = 0; i < 20; i++) {
    t += 0.02;
    packets.push([t, buildFrame(victimMac, exfilMac, victimIp, exfilIp, 55000 + i, 443, 0x18, exfilPayload, 2000 + i * 1400)]);
  }

  return packets;
}

function main() {
  const packets = buildIncident();
  writePcap("incident_node.pcap", packets);
  console.log(`Wrote incident_node.pcap with ${packets.length} packets spanning ` +
    `${(packets[packets.length - 1][0] - packets[0][0]).toFixed(2)} seconds.`);
  console.log("Open it in Wireshark to confirm it's a genuinely valid capture file.");
}

main();
