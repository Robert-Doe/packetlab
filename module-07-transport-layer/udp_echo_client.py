"""
Module 07 -- UDP echo client. Sends 15 numbered datagrams and reports
which replies never arrive -- no retry, no reordering logic, nothing.
This IS what "unreliable, connectionless" means in practice, not just in
the textbook definition.
"""
import socket

HOST, PORT = "127.0.0.1", 9009


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.settimeout(0.5)  # if a reply doesn't arrive quickly, it's not coming

        sent, received = 0, 0
        for i in range(1, 16):
            message = f"datagram #{i}".encode()
            sock.sendto(message, (HOST, PORT))
            sent += 1
            try:
                reply, _ = sock.recvfrom(1024)
                received += 1
                print(f"  #{i}: sent {message!r} -> got reply {reply!r}")
            except socket.timeout:
                print(f"  #{i}: sent {message!r} -> NO REPLY (lost, and nothing resends it for you)")

        print(f"\nSent {sent} datagrams, received {received} replies "
              f"({sent - received} lost, {100 * (sent - received) / sent:.0f}% loss).")
        print("Compare this to tcp_echo_client.py, which got all 5 of its")
        print("messages back with zero code written to handle loss -- because")
        print("TCP's retransmission logic handled it below the application layer.")


if __name__ == "__main__":
    main()
