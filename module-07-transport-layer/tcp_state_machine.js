/**
 * Module 07 — JS/Node port of tcp_state_machine.py. Same RFC 793 state
 * sequence, same two independent endpoints, same simultaneous-close bonus.
 */

const CLOSED = "CLOSED";
const LISTEN = "LISTEN";
const SYN_SENT = "SYN_SENT";
const SYN_RCVD = "SYN_RCVD";
const ESTABLISHED = "ESTABLISHED";
const FIN_WAIT_1 = "FIN_WAIT_1";
const FIN_WAIT_2 = "FIN_WAIT_2";
const CLOSE_WAIT = "CLOSE_WAIT";
const LAST_ACK = "LAST_ACK";
const TIME_WAIT = "TIME_WAIT";

class TcpEndpoint {
  constructor(name) {
    this.name = name;
    this.state = CLOSED;
  }

  transition(newState, because) {
    console.log(`  ${this.name}: ${this.state} -> ${newState}   (${because})`);
    this.state = newState;
  }
}

function simulateFullLifecycle() {
  const client = new TcpEndpoint("Client");
  const server = new TcpEndpoint("Server");

  console.log("=== Passive open: server starts listening ===");
  server.transition(LISTEN, "application called listen()");

  console.log("\n=== Three-way handshake ===");
  client.transition(SYN_SENT, "application called connect(), sent SYN");
  server.transition(SYN_RCVD, "received SYN, sent SYN-ACK");
  client.transition(ESTABLISHED, "received SYN-ACK, sent ACK");
  server.transition(ESTABLISHED, "received final ACK");

  console.log("\n=== Data transfer (both ESTABLISHED, no state changes) ===");
  console.log("  ... application sends/receives data here, states stay ESTABLISHED ...");

  console.log("\n=== Active close: client closes first ===");
  client.transition(FIN_WAIT_1, "application called close(), sent FIN");
  server.transition(CLOSE_WAIT, "received FIN, sent ACK (but server's own app hasn't closed yet)");
  client.transition(FIN_WAIT_2, "received ACK for its FIN");

  console.log("\n  ... server's application finishes what it was doing, THEN closes ...");
  server.transition(LAST_ACK, "application (finally) called close(), sent its own FIN");
  client.transition(TIME_WAIT, "received server's FIN, sent final ACK");
  server.transition(CLOSED, "received final ACK");

  console.log("\n=== TIME_WAIT ===");
  console.log("  Client sits in TIME_WAIT for 2*MSL (Maximum Segment Lifetime,");
  console.log("  commonly ~60s total in real stacks) before fully closing. This");
  console.log("  is why 'ss -tan' / 'netstat -an' right after closing a connection");
  console.log("  often still shows it, in TIME_WAIT, for a little while.");
  client.transition(CLOSED, "2*MSL timer expired (simulated instantly here)");
}

function simulateSimultaneousClose() {
  console.log("\n\n=== Bonus: simultaneous close (both sides close at once) ===");
  const a = new TcpEndpoint("A");
  const b = new TcpEndpoint("B");
  a.state = b.state = ESTABLISHED;
  console.log("  A and B both start ESTABLISHED");

  a.transition(FIN_WAIT_1, "closed, sent FIN");
  b.transition(FIN_WAIT_1, "closed (at nearly the same moment), sent its own FIN");

  console.log("  Each side's FIN crosses the other's FIN in flight -- both receive");
  console.log("  a FIN while still in FIN_WAIT_1, a case RFC 793 calls out explicitly:");
  a.transition("CLOSING", "received B's FIN while still in FIN_WAIT_1, sent ACK");
  b.transition("CLOSING", "received A's FIN while still in FIN_WAIT_1, sent ACK");
  a.transition(TIME_WAIT, "received ACK for its own FIN");
  b.transition(TIME_WAIT, "received ACK for its own FIN");
  console.log("  Both sides end up in TIME_WAIT directly from CLOSING -- a state");
  console.log("  transition that only exists to handle this exact overlap case.");
}

simulateFullLifecycle();
simulateSimultaneousClose();
