/**
 * Module 08 — JS/Node port of dns_client.py. Builds a real query packet
 * by hand and parses the real response, reusing dns_server.js's own
 * encode/decode helpers (imported, not duplicated).
 */
const dgram = require("dgram");
const { decodeQname, encodeQname } = require("./dns_server.js");

const HOST = "127.0.0.1";
const PORT = 5053;

function buildQuery(qname, qtype = 1) {
  const queryId = Math.floor(Math.random() * 0xffff);
  const header = Buffer.alloc(12);
  header.writeUInt16BE(queryId, 0);
  header.writeUInt16BE(0x0100, 2); // standard query, recursion desired
  header.writeUInt16BE(1, 4); // QDCOUNT

  const qtypeClass = Buffer.alloc(4);
  qtypeClass.writeUInt16BE(qtype, 0);
  qtypeClass.writeUInt16BE(1, 2); // QCLASS=IN

  const packet = Buffer.concat([header, encodeQname(qname), qtypeClass]);
  return { queryId, packet };
}

function parseResponse(data) {
  const queryId = data.readUInt16BE(0);
  const flags = data.readUInt16BE(2);
  const rcode = flags & 0x000f;
  const ancount = data.readUInt16BE(6);
  let [qname, offset] = decodeQname(data, 12);
  offset += 4; // skip QTYPE, QCLASS

  if (rcode !== 0 || ancount === 0) {
    return { queryId, qname, rcode, ip: null };
  }

  offset += 2; // compression pointer
  const rdlength = data.readUInt16BE(offset + 8);
  offset += 10;
  const ipBytes = data.subarray(offset, offset + rdlength);
  const ip = Array.from(ipBytes).join(".");
  return { queryId, qname, rcode, ip };
}

function query(qname) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    const { queryId: sentId, packet } = buildQuery(qname);
    console.log(`Querying ${qname} ...`);

    const timer = setTimeout(() => {
      console.log("  (timed out)");
      socket.close();
      resolve();
    }, 2000);

    socket.on("message", (data) => {
      clearTimeout(timer);
      const { queryId: recvId, qname: resolvedName, rcode, ip } = parseResponse(data);
      if (recvId !== sentId) {
        console.log("  WARNING: response ID doesn't match query ID -- would be rejected by a real resolver");
      }
      if (rcode === 0) {
        console.log(`  ${resolvedName} -> ${ip}  (TTL 300s)`);
      } else {
        console.log(`  ${resolvedName} -> NXDOMAIN (rcode=${rcode})`);
      }
      socket.close();
      resolve();
    });

    socket.send(packet, PORT, HOST);
  });
}

async function main() {
  await query("lab.test.");
  await query("www.lab.test.");
  await query("nonexistent.test.");
}

main();
