/**
 * Module 07 — JS/Node port of tcp_echo_client.py.
 */
const net = require("net");

const HOST = "127.0.0.1";
const PORT = 9017;

const socket = net.createConnection(PORT, HOST, () => {
  console.log(`Connected to ${HOST}:${PORT}`);
  sendNext(1);
});

function sendNext(i) {
  if (i > 5) {
    console.log("Closing connection (watch for TIME_WAIT on the server side now).");
    socket.end();
    return;
  }
  const message = `message #${i}`;
  socket.once("data", (data) => {
    const reply = data.toString();
    const status = reply === message ? "OK, matches" : "MISMATCH!";
    console.log(`  sent ${JSON.stringify(message)} -> got back ${JSON.stringify(reply)}  (${status})`);
    sendNext(i + 1);
  });
  socket.write(message);
}
