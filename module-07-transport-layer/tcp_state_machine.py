"""
Module 07 -- TCP's connection state machine (RFC 793), simulated
explicitly. Your OS's real TCP stack tracks these exact states internally
for every socket, but no portable, privilege-free API exposes "what state
is this specific socket in" directly from user-space Python -- the closest
you can get for real is watching `netstat`/`ss` output from OUTSIDE the
process (see tutorial.html Step 2). This file gives you the reference
model to compare that real observation against.

Two independent state machines -- Client and Server -- exchange simulated
segments (just event labels: SYN, SYN-ACK, ACK, FIN, FIN-ACK) and each
transitions independently, exactly like two real TCP stacks that only ever
learn about each other's state through the segments that cross the wire.
"""

CLOSED = "CLOSED"
LISTEN = "LISTEN"
SYN_SENT = "SYN_SENT"
SYN_RCVD = "SYN_RCVD"
ESTABLISHED = "ESTABLISHED"
FIN_WAIT_1 = "FIN_WAIT_1"
FIN_WAIT_2 = "FIN_WAIT_2"
CLOSE_WAIT = "CLOSE_WAIT"
LAST_ACK = "LAST_ACK"
TIME_WAIT = "TIME_WAIT"


class TcpEndpoint:
    def __init__(self, name):
        self.name = name
        self.state = CLOSED

    def transition(self, new_state, because):
        print(f"  {self.name}: {self.state} -> {new_state}   ({because})")
        self.state = new_state


def simulate_full_lifecycle():
    client = TcpEndpoint("Client")
    server = TcpEndpoint("Server")

    print("=== Passive open: server starts listening ===")
    server.transition(LISTEN, "application called listen()")

    print("\n=== Three-way handshake ===")
    client.transition(SYN_SENT, "application called connect(), sent SYN")
    server.transition(SYN_RCVD, "received SYN, sent SYN-ACK")
    client.transition(ESTABLISHED, "received SYN-ACK, sent ACK")
    server.transition(ESTABLISHED, "received final ACK")

    print("\n=== Data transfer (both ESTABLISHED, no state changes) ===")
    print("  ... application sends/receives data here, states stay ESTABLISHED ...")

    print("\n=== Active close: client closes first ===")
    client.transition(FIN_WAIT_1, "application called close(), sent FIN")
    server.transition(CLOSE_WAIT, "received FIN, sent ACK (but server's own app hasn't closed yet)")
    client.transition(FIN_WAIT_2, "received ACK for its FIN")

    print("\n  ... server's application finishes what it was doing, THEN closes ...")
    server.transition(LAST_ACK, "application (finally) called close(), sent its own FIN")
    client.transition(TIME_WAIT, "received server's FIN, sent final ACK")
    server.transition(CLOSED, "received final ACK")

    print("\n=== TIME_WAIT ===")
    print("  Client sits in TIME_WAIT for 2*MSL (Maximum Segment Lifetime,")
    print("  commonly ~60s total in real stacks) before fully closing. This")
    print("  is why 'ss -tan' / 'netstat -an' right after closing a connection")
    print("  often still shows it, in TIME_WAIT, for a little while.")
    client.transition(CLOSED, "2*MSL timer expired (simulated instantly here)")


def simulate_simultaneous_close():
    """The rarer case: BOTH sides close at nearly the same time, each
    seeing the other's FIN before receiving an ACK for their own."""
    print("\n\n=== Bonus: simultaneous close (both sides close at once) ===")
    a = TcpEndpoint("A")
    b = TcpEndpoint("B")
    a.state = b.state = ESTABLISHED
    print(f"  A and B both start ESTABLISHED")

    a.transition(FIN_WAIT_1, "closed, sent FIN")
    b.transition(FIN_WAIT_1, "closed (at nearly the same moment), sent its own FIN")

    print("  Each side's FIN crosses the other's FIN in flight -- both receive")
    print("  a FIN while still in FIN_WAIT_1, a case RFC 793 calls out explicitly:")
    a.transition("CLOSING", "received B's FIN while still in FIN_WAIT_1, sent ACK")
    b.transition("CLOSING", "received A's FIN while still in FIN_WAIT_1, sent ACK")
    a.transition(TIME_WAIT, "received ACK for its own FIN")
    b.transition(TIME_WAIT, "received ACK for its own FIN")
    print("  Both sides end up in TIME_WAIT directly from CLOSING -- a state")
    print("  transition that only exists to handle this exact overlap case.")


if __name__ == "__main__":
    simulate_full_lifecycle()
    simulate_simultaneous_close()
