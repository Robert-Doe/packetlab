/**
 * Module 08 — JS/Node port of dns_server.py. Same wire-format parsing,
 * same zone, same compression-pointer answer encoding, using Buffer
 * instead of struct.
 * Binds to 127.0.0.1:5053 (not port 53). See ../SAFETY.md.
 */
const dgram = require("dgram");

const HOST = "127.0.0.1";
const PORT = 5053;

const ZONE = {
  "lab.test.": "192.0.2.50",
  "www.lab.test.": "192.0.2.51",
};

function decodeQname(data, offset) {
  const labels = [];
  while (true) {
    const length = data[offset];
    if (length === 0) {
      offset += 1;
      break;
    }
    offset += 1;
    labels.push(data.subarray(offset, offset + length).toString("ascii"));
    offset += length;
  }
  return [labels.join(".") + ".", offset];
}

function encodeQname(name) {
  const parts = [];
  for (const label of name.replace(/\.$/, "").split(".")) {
    parts.push(Buffer.from([label.length]));
    parts.push(Buffer.from(label, "ascii"));
  }
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

function parseQuery(data) {
  const queryId = data.readUInt16BE(0);
  const [qname, offset] = decodeQname(data, 12);
  const qtype = data.readUInt16BE(offset);
  const qclass = data.readUInt16BE(offset + 2);
  return { queryId, qname, qtype, qclass };
}

function buildResponse(queryId, qname, qtype, qclass, ip) {
  const flags = ip ? 0x8180 : 0x8183;
  const ancount = ip ? 1 : 0;
  const header = Buffer.alloc(12);
  header.writeUInt16BE(queryId, 0);
  header.writeUInt16BE(flags, 2);
  header.writeUInt16BE(1, 4); // QDCOUNT
  header.writeUInt16BE(ancount, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(0, 10);

  const qtypeClass = Buffer.alloc(4);
  qtypeClass.writeUInt16BE(qtype, 0);
  qtypeClass.writeUInt16BE(qclass, 2);
  const question = Buffer.concat([encodeQname(qname), qtypeClass]);

  if (!ip) {
    return Buffer.concat([header, question]);
  }

  const answer = Buffer.alloc(2 + 2 + 2 + 4 + 2 + 4);
  let o = 0;
  answer.writeUInt16BE(0xc00c, o); o += 2; // compression pointer to offset 12
  answer.writeUInt16BE(1, o); o += 2;      // TYPE=A
  answer.writeUInt16BE(1, o); o += 2;      // CLASS=IN
  answer.writeUInt32BE(300, o); o += 4;    // TTL
  answer.writeUInt16BE(4, o); o += 2;      // RDLENGTH
  for (const octet of ip.split(".").map(Number)) {
    answer.writeUInt8(octet, o); o += 1;
  }

  return Buffer.concat([header, question, answer]);
}

if (require.main === module) {
  const server = dgram.createSocket("udp4");

  server.on("message", (data, rinfo) => {
    const { queryId, qname, qtype, qclass } = parseQuery(data);
    const ip = qtype === 1 ? ZONE[qname] : undefined;
    console.log(`  query from ${rinfo.address}:${rinfo.port}: ${qname} (type ${qtype}) -> ${ip || "NXDOMAIN"}`);
    const response = buildResponse(queryId, qname, qtype, qclass, ip);
    server.send(response, rinfo.port, rinfo.address);
  });

  server.bind(PORT, HOST, () => {
    console.log(`DNS server listening on ${HOST}:${PORT} (not port 53 -- see DECISIONS.md)`);
    console.log("Zone:", ZONE);
  });
}

module.exports = { decodeQname, encodeQname, parseQuery, buildResponse };
