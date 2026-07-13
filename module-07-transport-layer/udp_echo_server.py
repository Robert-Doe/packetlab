"""
Module 07 -- a UDP echo server that DELIBERATELY drops some replies, on
purpose, to make UDP's lack of guarantees visible instead of theoretical.

UDP itself doesn't drop packets under normal conditions -- your OS and
network hardware are usually reliable. What UDP lacks is any BUILT-IN
mechanism to notice or fix loss if it happens (congestion, a flaky link, a
saturated queue). This script fakes that "if it happens" condition on
purpose, at a fixed rate, so you can observe what UDP does about it:
nothing at all. No retransmission, no gap detection, no ordering
guarantee -- that's entirely on whatever's built on top of UDP to handle
(DNS does a version of this with retry+timeout; Module 08 builds a real one).

Binds to 127.0.0.1 only. See ../SAFETY.md.
"""
import random
import socket

HOST, PORT = "127.0.0.1", 9009
DROP_RATE = 0.3  # drop 30% of replies on purpose


def main():
    random.seed(7)  # reproducible drop pattern for this demo
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as server:
        server.bind((HOST, PORT))
        print(f"UDP echo server listening on {HOST}:{PORT}")
        print(f"Deliberately dropping ~{int(DROP_RATE * 100)}% of replies -- watch the client's gaps.")

        count = 0
        while True:
            data, addr = server.recvfrom(1024)
            count += 1
            if random.random() < DROP_RATE:
                print(f"  received #{count}: {data!r} -- DROPPING reply on purpose (simulated loss)")
                continue
            print(f"  received #{count}: {data!r} -- echoing back")
            server.sendto(data, addr)


if __name__ == "__main__":
    main()
