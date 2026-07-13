"""
Module 08 -- a minimal DNS client that builds a real query packet by hand
(struct, same as the server) and parses whatever comes back. This is
deliberately NOT using Python's higher-level DNS libraries, so every byte
on the wire is one you constructed yourself.
"""
import random
import socket
import struct

from dns_server import decode_qname, encode_qname

HOST, PORT = "127.0.0.1", 5053


def build_query(qname: str, qtype: int = 1) -> bytes:
    query_id = random.randint(0, 0xFFFF)
    flags = 0x0100  # standard query, recursion desired
    header = struct.pack("!HHHHHH", query_id, flags, 1, 0, 0, 0)
    question = encode_qname(qname) + struct.pack("!HH", qtype, 1)  # QCLASS=1 (IN)
    return query_id, header + question


def parse_response(data: bytes):
    query_id, flags, qdcount, ancount, nscount, arcount = struct.unpack("!HHHHHH", data[:12])
    rcode = flags & 0x000F
    qname, offset = decode_qname(data, 12)
    offset += 4  # skip QTYPE, QCLASS

    if rcode != 0 or ancount == 0:
        return query_id, qname, rcode, None

    # answer NAME is a 2-byte compression pointer in this server's replies
    offset += 2
    atype, aclass, ttl, rdlength = struct.unpack("!HHIH", data[offset:offset + 10])
    offset += 10
    ip_bytes = data[offset:offset + rdlength]
    ip = ".".join(str(b) for b in ip_bytes)
    return query_id, qname, rcode, ip


def query(qname: str):
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.settimeout(2)
        sent_id, packet = build_query(qname)
        print(f"Querying {qname} ...")
        sock.sendto(packet, (HOST, PORT))
        data, _ = sock.recvfrom(512)
        recv_id, resolved_name, rcode, ip = parse_response(data)
        assert recv_id == sent_id, "response ID doesn't match query ID -- would be rejected by a real resolver"
        if rcode == 0:
            print(f"  {resolved_name} -> {ip}  (TTL 300s)")
        else:
            print(f"  {resolved_name} -> NXDOMAIN (rcode={rcode})")


if __name__ == "__main__":
    query("lab.test.")
    query("www.lab.test.")
    query("nonexistent.test.")
