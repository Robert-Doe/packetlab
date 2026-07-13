"""
Module 13 -- a real HTTPS server using the toy CA's leaf certificate.
This performs an actual TLS handshake with any real TLS client that
connects (curl, a browser, tls_client.py) -- not a simulation.

Run toy_ca.py first to generate leaf_cert.pem / leaf_key.pem.
Binds to 127.0.0.1:8443. See ../SAFETY.md.
"""
import socket
import ssl

HOST, PORT = "127.0.0.1", 8443


def main():
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile="leaf_cert.pem", keyfile="leaf_key.pem")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((HOST, PORT))
        sock.listen(5)
        print(f"TLS server on https://{HOST}:{PORT} using the toy CA's leaf cert (CN=lab.test)")

        with context.wrap_socket(sock, server_side=True) as tls_sock:
            while True:
                try:
                    conn, addr = tls_sock.accept()
                except ssl.SSLError as e:
                    print(f"  handshake failed with a client: {e}")
                    continue

                with conn:
                    print(f"  handshake succeeded with {addr}")
                    print(f"    negotiated protocol: {conn.version()}")
                    print(f"    negotiated cipher:   {conn.cipher()}")
                    conn.recv(4096)  # discard the request
                    body = b"Hello over a real TLS connection.\n"
                    response = (
                        b"HTTP/1.1 200 OK\r\n"
                        b"Content-Type: text/plain\r\n"
                        b"Content-Length: " + str(len(body)).encode() + b"\r\n"
                        b"Connection: close\r\n\r\n" + body
                    )
                    conn.sendall(response)


if __name__ == "__main__":
    main()
