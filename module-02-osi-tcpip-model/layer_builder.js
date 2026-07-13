/**
 * Module 02 — JS/Node variant of layer_builder.py.
 *
 * Same exercise, using Node's Buffer instead of Python's struct. Compare
 * the two side by side: struct.pack format strings vs. Buffer.writeUIntBE
 * calls are two different APIs for the exact same job -- laying out bytes
 * in a precise, network-byte-order (big-endian) sequence.
 *
 * Touches no network. All addresses are from documentation-reserved
 * ranges (RFC 5737 IPv4, RFC 2606 .invalid TLD, locally-administered MAC).
 */

function checksum16(buf) {
  let data = buf;
  if (data.length % 2 !== 0) {
    data = Buffer.concat([data, Buffer.from([0])]);
  }
  let total = 0;
  for (let i = 0; i < data.length; i += 2) {
    total += data.readUInt16BE(i);
  }
  while (total >> 16) {
    total = (total & 0xffff) + (total >> 16);
  }
  return ~total & 0xffff;
}

function buildEthernetHeader(dstMac, srcMac, ethertype) {
  const buf = Buffer.alloc(14);
  dstMac.copy(buf, 0);
  srcMac.copy(buf, 6);
  buf.writeUInt16BE(ethertype, 12);
  return buf;
}

function ipToBytes(ip) {
  return Buffer.from(ip.split(".").map(Number));
}

function buildIpv4Header(srcIp, dstIp, payloadLen) {
  const versionIhl = (4 << 4) | 5;
  const totalLength = 20 + payloadLen;

  const withZeroChecksum = Buffer.alloc(20);
  withZeroChecksum.writeUInt8(versionIhl, 0);
  withZeroChecksum.writeUInt8(0, 1); // ToS
  withZeroChecksum.writeUInt16BE(totalLength, 2);
  withZeroChecksum.writeUInt16BE(0x1c46, 4); // identification
  withZeroChecksum.writeUInt16BE(0x4000, 6); // flags: Don't Fragment
  withZeroChecksum.writeUInt8(64, 8); // TTL
  withZeroChecksum.writeUInt8(6, 9); // protocol: TCP
  withZeroChecksum.writeUInt16BE(0, 10); // checksum placeholder
  ipToBytes(srcIp).copy(withZeroChecksum, 12);
  ipToBytes(dstIp).copy(withZeroChecksum, 16);

  const csum = checksum16(withZeroChecksum);
  const finalHeader = Buffer.from(withZeroChecksum);
  finalHeader.writeUInt16BE(csum, 10);
  return finalHeader;
}

function buildTcpHeader(srcPort, dstPort, seq, ack, flags) {
  const buf = Buffer.alloc(20);
  buf.writeUInt16BE(srcPort, 0);
  buf.writeUInt16BE(dstPort, 2);
  buf.writeUInt32BE(seq, 4);
  buf.writeUInt32BE(ack, 8);
  const dataOffsetAndFlags = (5 << 12) | flags; // 5 * 4 = 20 bytes, no options
  buf.writeUInt16BE(dataOffsetAndFlags, 12);
  buf.writeUInt16BE(64240, 14); // window
  buf.writeUInt16BE(0, 16); // checksum -- needs a pseudo-header, skipped here (see DECISIONS.md)
  buf.writeUInt16BE(0, 18); // urgent pointer
  return buf;
}

function hexdumpAnnotated(frame, boundaries) {
  console.log(`Total frame size: ${frame.length} bytes\n`);
  for (const [label, start, end] of boundaries) {
    const chunk = frame.subarray(start, end);
    const hexStr = Array.from(chunk).map((b) => b.toString(16).padStart(2, "0")).join(" ");
    console.log(`--- ${label}  (bytes ${start}-${end - 1}, ${end - start} bytes) ---`);
    console.log(hexStr);
    console.log();
  }
}

function main() {
  const dstMac = Buffer.from("deadbeef0001", "hex");
  const srcMac = Buffer.from("deadbeef0002", "hex");
  const eth = buildEthernetHeader(dstMac, srcMac, 0x0800);

  const payload = Buffer.from("GET /layer-demo HTTP/1.1\r\nHost: example.invalid\r\n\r\n");

  const tcp = buildTcpHeader(51820, 8080, 1000, 0, 0x02); // SYN flag

  const ip = buildIpv4Header("192.0.2.10", "192.0.2.20", tcp.length + payload.length);

  const frame = Buffer.concat([eth, ip, tcp, payload]);

  const boundaries = [
    ["LAYER 2 -- Ethernet header (Data Link)", 0, 14],
    ["LAYER 3 -- IPv4 header (Network)", 14, 34],
    ["LAYER 4 -- TCP header (Transport)", 34, 54],
    ["LAYER 7 -- HTTP request (Application)", 54, frame.length],
  ];
  hexdumpAnnotated(frame, boundaries);

  const ipTotalLength = 20 + tcp.length + payload.length;
  console.log("Readable summary:");
  console.log(`  Ethernet : ${srcMac.toString("hex").match(/../g).join(":")} -> ${dstMac.toString("hex").match(/../g).join(":")}, EtherType 0x0800 (IPv4)`);
  console.log(`  IPv4     : 192.0.2.10 -> 192.0.2.20, protocol 6 (TCP), total length ${ipTotalLength}`);
  console.log(`  TCP      : port 51820 -> 8080, flags 0x02 (SYN), seq=1000`);
  console.log(`  HTTP     : ${payload.toString().split("\r\n")[0]}`);
  console.log();
  console.log("Same 91-byte IP total length as the Python variant -- two");
  console.log("different languages building byte-for-byte identical output");
  console.log("from the same header layout rules.");
}

main();
