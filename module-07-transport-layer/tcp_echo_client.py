"""
Module 07 -- TCP echo client. Sends 5 numbered messages and confirms every
single one comes back, in order, unmodified.
"""
import socket

HOST, PORT = "127.0.0.1", 9007


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT))
        print(f"Connected to {HOST}:{PORT}")

        for i in range(1, 6):
            message = f"message #{i}".encode()
            sock.sendall(message)
            reply = sock.recv(1024)
            status = "OK, matches" if reply == message else "MISMATCH!"
            print(f"  sent {message!r} -> got back {reply!r}  ({status})")

        print("Closing connection (watch for TIME_WAIT on the server side now).")


if __name__ == "__main__":
    main()
