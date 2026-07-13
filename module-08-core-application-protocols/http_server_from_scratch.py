"""
Module 08 -- an HTTP/1.1 server built directly on a raw TCP socket, with
NO framework (no Flask, no http.server) doing the parsing for you. Every
other module's servers used Flask, which quietly handles request-line
parsing, header parsing, and response formatting. This file shows you
exactly what Flask was hiding.

Binds to 127.0.0.1:8090. See ../SAFETY.md.
"""
import socket

HOST, PORT = "127.0.0.1", 8090


def parse_request(raw: bytes):
    """Parses raw bytes up to the blank line into (method, path, version, headers)."""
    header_part, _, _ = raw.partition(b"\r\n\r\n")
    lines = header_part.split(b"\r\n")
    request_line = lines[0].decode()
    method, path, version = request_line.split(" ")

    headers = {}
    for line in lines[1:]:
        if not line:
            continue
        name, _, value = line.partition(b":")
        headers[name.decode().strip().lower()] = value.decode().strip()

    return method, path, version, headers


def build_response(status_code: int, status_text: str, body: bytes, content_type="text/plain"):
    headers = (
        f"HTTP/1.1 {status_code} {status_text}\r\n"
        f"Content-Type: {content_type}\r\n"
        f"Content-Length: {len(body)}\r\n"
        f"Connection: close\r\n"
        f"\r\n"
    ).encode()
    return headers + body


ROUTES = {
    "/": lambda: build_response(200, "OK", b"Hello from a hand-rolled HTTP server.\n"),
    "/about": lambda: build_response(200, "OK", b"This response was assembled byte by byte, no framework involved.\n"),
}


def handle_connection(conn: socket.socket, addr):
    # A real server would loop reading until it saw \r\n\r\n, handling the
    # case where the request arrives across multiple TCP segments. This
    # demo reads once and assumes the (small) request fits in one recv --
    # see DECISIONS.md for why that's an acceptable simplification here.
    raw = conn.recv(4096)
    if not raw:
        return

    try:
        method, path, version, headers = parse_request(raw)
    except (ValueError, IndexError):
        response = build_response(400, "Bad Request", b"Malformed request line\n")
        conn.sendall(response)
        return

    print(f"  {addr}: {method} {path} {version}")
    print(f"    headers: {headers}")

    if method != "GET":
        response = build_response(405, "Method Not Allowed", b"Only GET is implemented\n")
    elif path in ROUTES:
        response = ROUTES[path]()
    else:
        response = build_response(404, "Not Found", f"No route for {path}\n".encode())

    conn.sendall(response)


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(5)
        print(f"Hand-rolled HTTP server on http://{HOST}:{PORT}  (routes: {list(ROUTES)})")

        while True:
            conn, addr = server.accept()
            with conn:
                handle_connection(conn, addr)


if __name__ == "__main__":
    main()
