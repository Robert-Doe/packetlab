/**
 * packet.ts — TypeScript/browser port of
 * module-02-osi-tcpip-model/layer_builder.js.
 *
 * The original uses Node's Buffer (writeUIntBE / readUInt16BE etc.) to lay
 * out real Ethernet + IPv4 + TCP header bytes in network byte order
 * (big-endian). Buffer doesn't exist in the browser, so this port uses
 * DataView over a plain Uint8Array instead — a different API for the exact
 * same job, matching the original module's own note about struct.pack vs.
 * Buffer.writeUIntBE being "two different APIs for the exact same job."
 *
 * The header layouts, field widths, byte order, and the IPv4 checksum
 * algorithm (RFC 1071 one's-complement sum) are copied field-for-field
 * from the original — this produces byte-identical output for the same
 * inputs, not a picture of the algorithm.
 */

export interface FieldSpan {
  label: string;
  start: number; // inclusive, offset into the whole frame
  end: number; // exclusive
  detail: string;
}

export interface BuiltFrame {
  bytes: Uint8Array;
  fields: FieldSpan[];
  summary: {
    ethernet: string;
    ip: string;
    tcp: string;
  };
}

export interface PacketFields {
  dstMac: string; // "aa:bb:cc:dd:ee:ff"
  srcMac: string;
  srcIp: string; // "1.2.3.4"
  dstIp: string;
  srcPort: number;
  dstPort: number;
  flags: {
    syn: boolean;
    ack: boolean;
    fin: boolean;
    rst: boolean;
    psh: boolean;
    urg: boolean;
  };
  seq: number;
  ackNum: number;
  payloadText: string;
}

const TCP_FLAG_BITS: Record<keyof PacketFields["flags"], number> = {
  fin: 0x01,
  syn: 0x02,
  rst: 0x04,
  psh: 0x08,
  ack: 0x10,
  urg: 0x20,
};

export function macToBytes(mac: string): Uint8Array {
  const parts = mac.split(/[:-]/).map((p) => parseInt(p, 16));
  if (parts.length !== 6 || parts.some((b) => Number.isNaN(b) || b < 0 || b > 255)) {
    throw new Error(`not a valid MAC address: ${mac}`);
  }
  return Uint8Array.from(parts);
}

export function ipToBytes(ip: string): Uint8Array {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
    throw new Error(`not a valid IPv4 address: ${ip}`);
  }
  return Uint8Array.from(octets);
}

/** RFC 1071 16-bit one's-complement checksum, ported verbatim from checksum16() in layer_builder.js. */
export function checksum16(data: Uint8Array): number {
  let bytes = data;
  if (bytes.length % 2 !== 0) {
    const padded = new Uint8Array(bytes.length + 1);
    padded.set(bytes);
    bytes = padded;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let total = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    total += view.getUint16(i, false);
  }
  while (total >> 16) {
    total = (total & 0xffff) + (total >> 16);
  }
  return ~total & 0xffff;
}

function buildEthernetHeader(dstMac: Uint8Array, srcMac: Uint8Array, ethertype: number): Uint8Array {
  const buf = new Uint8Array(14);
  const view = new DataView(buf.buffer);
  buf.set(dstMac, 0);
  buf.set(srcMac, 6);
  view.setUint16(12, ethertype, false);
  return buf;
}

function buildIpv4Header(srcIp: string, dstIp: string, payloadLen: number): Uint8Array {
  const versionIhl = (4 << 4) | 5;
  const totalLength = 20 + payloadLen;

  const buf = new Uint8Array(20);
  const view = new DataView(buf.buffer);
  view.setUint8(0, versionIhl);
  view.setUint8(1, 0); // ToS
  view.setUint16(2, totalLength, false);
  view.setUint16(4, 0x1c46, false); // identification
  view.setUint16(6, 0x4000, false); // flags: Don't Fragment
  view.setUint8(8, 64); // TTL
  view.setUint8(9, 6); // protocol: TCP
  view.setUint16(10, 0, false); // checksum placeholder
  buf.set(ipToBytes(srcIp), 12);
  buf.set(ipToBytes(dstIp), 16);

  const csum = checksum16(buf);
  const final = new Uint8Array(buf);
  const finalView = new DataView(final.buffer);
  finalView.setUint16(10, csum, false);
  return final;
}

function buildTcpHeader(
  srcPort: number,
  dstPort: number,
  seq: number,
  ackNum: number,
  flagBits: number
): Uint8Array {
  const buf = new Uint8Array(20);
  const view = new DataView(buf.buffer);
  view.setUint16(0, srcPort, false);
  view.setUint16(2, dstPort, false);
  view.setUint32(4, seq >>> 0, false);
  view.setUint32(8, ackNum >>> 0, false);
  const dataOffsetAndFlags = (5 << 12) | flagBits; // 5 * 4 = 20 bytes, no options
  view.setUint16(12, dataOffsetAndFlags, false);
  view.setUint16(14, 64240, false); // window
  view.setUint16(16, 0, false); // checksum -- needs a pseudo-header, skipped here (matches original)
  view.setUint16(18, 0, false); // urgent pointer
  return buf;
}

function flagsToBits(flags: PacketFields["flags"]): number {
  let bits = 0;
  (Object.keys(flags) as Array<keyof PacketFields["flags"]>).forEach((k) => {
    if (flags[k]) bits |= TCP_FLAG_BITS[k];
  });
  return bits;
}

function flagsToLabel(flags: PacketFields["flags"]): string {
  const active = (Object.keys(flags) as Array<keyof PacketFields["flags"]>)
    .filter((k) => flags[k])
    .map((k) => k.toUpperCase());
  return active.length ? active.join(",") : "(none)";
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function buildFrame(fields: PacketFields): BuiltFrame {
  const dstMac = macToBytes(fields.dstMac);
  const srcMac = macToBytes(fields.srcMac);
  const eth = buildEthernetHeader(dstMac, srcMac, 0x0800);

  const payload = new TextEncoder().encode(fields.payloadText);
  const flagBits = flagsToBits(fields.flags);
  const tcp = buildTcpHeader(fields.srcPort, fields.dstPort, fields.seq, fields.ackNum, flagBits);
  const ip = buildIpv4Header(fields.srcIp, fields.dstIp, tcp.length + payload.length);

  const bytes = concat(eth, ip, tcp, payload);

  const ethOff = 0;
  const ipOff = 14;
  const tcpOff = 34;
  const payloadOff = 54;

  const fieldSpans: FieldSpan[] = [
    { label: "Dst MAC", start: ethOff + 0, end: ethOff + 6, detail: fields.dstMac },
    { label: "Src MAC", start: ethOff + 6, end: ethOff + 12, detail: fields.srcMac },
    { label: "EtherType", start: ethOff + 12, end: ethOff + 14, detail: "0x0800 (IPv4)" },

    { label: "Version/IHL", start: ipOff + 0, end: ipOff + 1, detail: "IPv4, 20-byte header" },
    { label: "ToS", start: ipOff + 1, end: ipOff + 2, detail: "0x00" },
    { label: "Total Length", start: ipOff + 2, end: ipOff + 4, detail: `${20 + tcp.length + payload.length} bytes` },
    { label: "Identification", start: ipOff + 4, end: ipOff + 6, detail: "0x1c46" },
    { label: "Flags/Frag", start: ipOff + 6, end: ipOff + 8, detail: "0x4000 (Don't Fragment)" },
    { label: "TTL", start: ipOff + 8, end: ipOff + 9, detail: "64" },
    { label: "Protocol", start: ipOff + 9, end: ipOff + 10, detail: "6 (TCP)" },
    { label: "Header Checksum", start: ipOff + 10, end: ipOff + 12, detail: "RFC 1071 one's-complement" },
    { label: "Src IP", start: ipOff + 12, end: ipOff + 16, detail: fields.srcIp },
    { label: "Dst IP", start: ipOff + 16, end: ipOff + 20, detail: fields.dstIp },

    { label: "Src Port", start: tcpOff + 0, end: tcpOff + 2, detail: String(fields.srcPort) },
    { label: "Dst Port", start: tcpOff + 2, end: tcpOff + 4, detail: String(fields.dstPort) },
    { label: "Seq Number", start: tcpOff + 4, end: tcpOff + 8, detail: String(fields.seq) },
    { label: "Ack Number", start: tcpOff + 8, end: tcpOff + 12, detail: String(fields.ackNum) },
    { label: "Data Offset/Flags", start: tcpOff + 12, end: tcpOff + 14, detail: flagsToLabel(fields.flags) },
    { label: "Window", start: tcpOff + 14, end: tcpOff + 16, detail: "64240" },
    { label: "Checksum", start: tcpOff + 16, end: tcpOff + 18, detail: "0x0000 (pseudo-header skipped)" },
    { label: "Urgent Pointer", start: tcpOff + 18, end: tcpOff + 20, detail: "0" },
  ];

  if (payload.length > 0) {
    fieldSpans.push({
      label: "Payload",
      start: payloadOff,
      end: payloadOff + payload.length,
      detail: `${payload.length} bytes`,
    });
  }

  const macStr = (b: Uint8Array) =>
    Array.from(b)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(":");

  return {
    bytes,
    fields: fieldSpans,
    summary: {
      ethernet: `${macStr(srcMac)} -> ${macStr(dstMac)}, EtherType 0x0800 (IPv4)`,
      ip: `${fields.srcIp} -> ${fields.dstIp}, protocol 6 (TCP), total length ${20 + tcp.length + payload.length}`,
      tcp: `port ${fields.srcPort} -> ${fields.dstPort}, flags ${flagsToLabel(fields.flags)}, seq=${fields.seq}`,
    },
  };
}
