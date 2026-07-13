/**
 * Module 13 — a Node TLS client connecting to tls_server.py, a completely
 * independent TLS implementation (Python's `ssl`, built on OpenSSL) than
 * Node's own `tls` module. This is deliberately a cross-language interop
 * test, not a port -- Module 13's certificate/CA generation stays in
 * Python (see DECISIONS.md for why), and this file proves the resulting
 * real X.509 certificate validates correctly against a totally different
 * TLS stack, exactly as it would need to for real-world interoperability.
 *
 * Same two attempts as tls_client.py: trusting the toy CA (succeeds) vs.
 * not (fails with a real certificate error).
 */
const tls = require("tls");
const fs = require("fs");

const HOST = "127.0.0.1";
const PORT = 8443;

function tryConnect(options, label) {
  return new Promise((resolve) => {
    console.log(`--- ${label} ---`);
    const socket = tls.connect(
      { host: HOST, port: PORT, servername: "lab.test", ...options },
      () => {
        console.log("  Handshake SUCCEEDED.");
        console.log(`  Negotiated protocol: ${socket.getProtocol()}`);
        console.log(`  Negotiated cipher:   ${JSON.stringify(socket.getCipher())}`);
        const cert = socket.getPeerCertificate();
        console.log(`  Peer certificate subject: ${JSON.stringify(cert.subject)}`);

        socket.write("GET / HTTP/1.1\r\nHost: lab.test\r\nConnection: close\r\n\r\n");
      }
    );

    let data = "";
    socket.on("data", (chunk) => { data += chunk; });
    socket.on("end", () => {
      if (data) console.log(`  Response: ${data.split("\r\n")[0]}`);
      console.log();
      resolve();
    });
    socket.on("error", (err) => {
      console.log(`  Handshake FAILED: ${err.code || err.message}`);
      console.log();
      resolve();
    });
  });
}

async function main() {
  console.log("Attempt 1: trusting the toy CA explicitly\n");
  const caCert = fs.readFileSync("ca_cert.pem");
  await tryConnect({ ca: caCert }, "Client trusts ca_cert.pem");

  console.log("Attempt 2: using only the normal system trust store (NOT trusting our toy CA)\n");
  await tryConnect({}, "Client does NOT trust our toy CA");
}

main();
