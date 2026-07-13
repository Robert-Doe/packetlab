/**
 * Module 07 — JS/Node port of udp_echo_server.py. Same deliberate-drop
 * demonstration using Node's `dgram` module (UDP).
 * Binds to 127.0.0.1 only. See ../SAFETY.md.
 */
const dgram = require("dgram");

const HOST = "127.0.0.1";
const PORT = 9019; // different port from the Python variant

const DROP_RATE = 0.3;

// A small seeded PRNG so this demo's drop pattern is reproducible run to
// run, same spirit as Python's random.seed(7) -- Math.random() can't be
// seeded directly in Node, so a tiny linear congruential generator stands in.
function makeSeededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
const rng = makeSeededRandom(7);

const server = dgram.createSocket("udp4");
let count = 0;

server.on("message", (msg, rinfo) => {
  count++;
  if (rng() < DROP_RATE) {
    console.log(`  received #${count}: ${JSON.stringify(msg.toString())} -- DROPPING reply on purpose (simulated loss)`);
    return;
  }
  console.log(`  received #${count}: ${JSON.stringify(msg.toString())} -- echoing back`);
  server.send(msg, rinfo.port, rinfo.address);
});

server.bind(PORT, HOST, () => {
  console.log(`UDP echo server listening on ${HOST}:${PORT}`);
  console.log(`Deliberately dropping ~${Math.round(DROP_RATE * 100)}% of replies -- watch the client's gaps.`);
});
