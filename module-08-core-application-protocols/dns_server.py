"""
Module 08 -- a real, minimal authoritative DNS server: parses actual DNS
wire-format queries (the same encoding your OS resolver sends every time
you visit a website) and returns actual DNS wire-format A-record answers,
built entirely with struct -- same technique as Module 02's layer_builder.py,
one layer higher in the stack.

Binds to 127.0.0.1:5053 (NOT port 53 -- that needs root/admin on most
systems, and this server should never be mistaken for your real resolver).
See ../SAFETY.md.
"""
import socket
import struct

HOST, PORT = "127.0.0.1", 5053

# A tiny authoritative zone. .test is reserved by RFC 2606 specifically so
# example zones like this one never collide with a real domain.
ZONE = {
    "lab.test.": "192.0.2.50",
    "www.lab.test.": "192.0.2.51",
}


def decode_qname(data: bytes, offset: int):
    """Reads a sequence of length-prefixed labels starting at `offset`,
    returns (dotted_name, new_offset_after_the_terminating_zero_byte)."""
    labels = []
    while True:
        length = data[offset]
        if length == 0:
            offset += 1
            break
        offset += 1
        labels.append(data[offset:offset + length].decode("ascii"))
        offset += length
    return ".".join(labels) + ".", offset


def encode_qname(name: str) -> bytes:
    out = b""
    for label in name.rstrip(".").split("."):
        out += struct.pack("!B", len(label)) + label.encode("ascii")
    return out + b"\x00"


def parse_query(data: bytes):
    query_id, flags, qdcount, ancount, nscount, arcount = struct.unpack("!HHHHHH", data[:12])
    qname, offset = decode_qname(data, 12)
    qtype, qclass = struct.unpack("!HH", data[offset:offset + 4])
    return query_id, qname, qtype, qclass


def build_response(query_id: int, qname: str, qtype: int, qclass: int, ip):
    # ip: str or None (None means NXDOMAIN) -- kept unannotated since the
    # `str | None` union syntax needs Python 3.10+, and this course targets 3.9+
    flags = 0x8180 if ip else 0x8183  # standard response, RCODE 0 (ok) or 3 (NXDOMAIN)
    ancount = 1 if ip else 0
    header = struct.pack("!HHHHHH", query_id, flags, 1, ancount, 0, 0)

    question = encode_qname(qname) + struct.pack("!HH", qtype, qclass)

    if not ip:
        return header + question

    # NAME field uses a compression pointer (0xC00C) back to byte offset 12
    # (the start of the question section) instead of repeating the name --
    # this is exactly what real authoritative servers do, not a shortcut.
    answer = struct.pack("!H", 0xC00C)
    answer += struct.pack("!HH", 1, 1)  # TYPE=A, CLASS=IN
    answer += struct.pack("!I", 300)     # TTL: 300 seconds
    ip_bytes = bytes(int(o) for o in ip.split("."))
    answer += struct.pack("!H", 4) + ip_bytes  # RDLENGTH=4, RDATA=the IP

    return header + question + answer


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.bind((HOST, PORT))
        print(f"DNS server listening on {HOST}:{PORT} (not port 53 -- see DECISIONS.md)")
        print(f"Zone: {ZONE}")

        while True:
            data, addr = sock.recvfrom(512)
            query_id, qname, qtype, qclass = parse_query(data)
            ip = ZONE.get(qname) if qtype == 1 else None  # only answer A (type 1) queries
            print(f"  query from {addr}: {qname} (type {qtype}) -> {ip or 'NXDOMAIN'}")
            response = build_response(query_id, qname, qtype, qclass, ip)
            sock.sendto(response, addr)


if __name__ == "__main__":
    main()
