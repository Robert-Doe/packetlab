/**
 * Module 07 — JS/Node port of udp_echo_client.py. Sends 15 datagrams,
 * uses a timeout to detect replies that never arrive -- no retry logic,
 * exactly like the Python variant.
 */
const dgram = require("dgram");

const HOST = "127.0.0.1";
const PORT = 9019;
const TIMEOUT_MS = 500;

const socket = dgram.createSocket("udp4");
let sent = 0;
let received = 0;

function sendOne(i) {
  return new Promise((resolve) => {
    const message = Buffer.from(`datagram #${i}`);
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.log(`  #${i}: sent ${JSON.stringify(message.toString())} -> NO REPLY (lost, and nothing resends it for you)`);
        socket.removeListener("message", onMessage);
        resolve();
      }
    }, TIMEOUT_MS);

    function onMessage(reply) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        received++;
        console.log(`  #${i}: sent ${JSON.stringify(message.toString())} -> got reply ${JSON.stringify(reply.toString())}`);
        resolve();
      }
    }

    socket.once("message", onMessage);
    socket.send(message, PORT, HOST);
    sent++;
  });
}

async function main() {
  for (let i = 1; i <= 15; i++) {
    await sendOne(i);
  }
  const lossPct = Math.round((100 * (sent - received)) / sent);
  console.log(`\nSent ${sent} datagrams, received ${received} replies (${sent - received} lost, ${lossPct}% loss).`);
  console.log("Compare this to tcp_echo_client.js, which got all 5 of its");
  console.log("messages back with zero code written to handle loss -- because");
  console.log("TCP's retransmission logic handled it below the application layer.");
  socket.close();
}

main();
