"""
Module 02 -- generates real traffic against http_target_server.py using the
raw `socket` module (not requests/urllib), so every step below corresponds
to something you can literally point at in a Wireshark capture:

  socket.socket(...)   -> nothing on the wire yet, just a local file descriptor
  sock.connect(...)    -> THIS is the TCP three-way handshake: SYN, SYN-ACK, ACK
  sock.sendall(...)    -> your HTTP request, riding inside a TCP segment
  sock.recv(...)       -> the server's HTTP response, arriving in one or
                          more TCP segments (Wireshark may show it reassembled)
  sock.close()          -> the TCP four-way teardown: FIN, ACK, FIN, ACK

Run http_target_server.py first, start a Wireshark capture on your loopback
interface filtered to `tcp.port == 8080`, THEN run this script.
"""
import socket

HOST = "127.0.0.1"
PORT = 8080


def main():
    print(f"Step 1: creating a TCP socket (no network activity yet)")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    print(f"Step 2: connect({HOST}:{PORT}) -- this is where the 3-way handshake happens")
    print("        (SYN out, SYN-ACK back, ACK out -- watch for exactly these 3 packets)")
    sock.connect((HOST, PORT))
    print("        connected.")

    request = (
        f"GET /layer-demo HTTP/1.1\r\n"
        f"Host: {HOST}:{PORT}\r\n"
        f"Connection: close\r\n"
        f"\r\n"
    ).encode()

    print(f"Step 3: sendall() -- {len(request)} bytes of HTTP request going out inside a TCP segment")
    sock.sendall(request)

    print("Step 4: recv() -- waiting for the response")
    response = b""
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            break
        response += chunk
    print(f"        received {len(response)} bytes total")

    print("Step 5: close() -- this is where the connection teardown happens")
    print("        (FIN out, ACK back, FIN back, ACK out -- 4 packets to watch for)")
    sock.close()

    print()
    print("--- Response ---")
    print(response.decode(errors="replace"))


if __name__ == "__main__":
    main()
