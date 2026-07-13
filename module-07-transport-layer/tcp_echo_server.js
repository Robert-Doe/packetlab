/**
 * Module 07 — JS/Node port of tcp_echo_server.py. Same reliable-delivery
 * demonstration using Node's `net` module (TCP).
 * Binds to 127.0.0.1 only. See ../SAFETY.md.
 */
const net = require("net");

const HOST = "127.0.0.1";
const PORT = 9017; // different port from the Python variant so both can run side by side

const server = net.createServer((socket) => {
  console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort}`);
  let count = 0;
  socket.on("data", (data) => {
    count++;
    console.log(`  received #${count}: ${JSON.stringify(data.toString())} -- echoing back unchanged`);
    socket.write(data);
  });
  socket.on("end", () => {
    console.log(`Client closed the connection after ${count} messages.`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`TCP echo server listening on ${HOST}:${PORT}`);
  console.log("Run 'netstat -an | findstr 9017' (Windows) or 'ss -tan | grep 9017'");
  console.log("(Linux/Mac) in ANOTHER terminal to see the real ESTABLISHED/TIME_WAIT states.");
});
