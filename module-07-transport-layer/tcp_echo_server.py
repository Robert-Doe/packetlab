"""
Module 07 -- a real TCP echo server. Every message sent arrives, in order,
exactly once -- that's not this code being careful, that's TCP's own job.
Binds to 127.0.0.1 only. See ../SAFETY.md.
"""
import socket

HOST, PORT = "127.0.0.1", 9007


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(1)
        print(f"TCP echo server listening on {HOST}:{PORT}")
        print("Run 'netstat -an | findstr 9007' (Windows) or 'ss -tan | grep 9007'")
        print("(Linux/Mac) in ANOTHER terminal while a client is connected to see")
        print("the real ESTABLISHED state -- and again right after it disconnects")
        print("to catch the real TIME_WAIT state from tcp_state_machine.py.")

        conn, addr = server.accept()
        with conn:
            print(f"Connection from {addr}")
            count = 0
            while True:
                data = conn.recv(1024)
                if not data:
                    break
                count += 1
                print(f"  received #{count}: {data!r} -- echoing back unchanged")
                conn.sendall(data)
            print(f"Client closed the connection after {count} messages.")


if __name__ == "__main__":
    main()
