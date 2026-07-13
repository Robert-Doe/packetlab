"""
Module 02 — build a frame byte-by-byte, by hand, so you see exactly which
bytes belong to which layer BEFORE you go look at a real capture in
Wireshark.

This script never touches the network. It only assembles bytes in memory
using struct.pack, the same way a NIC driver or kernel network stack would,
and prints an annotated hex dump. All addresses used are deliberately from
ranges reserved for documentation (RFC 5737 for IPv4, a locally-administered
MAC block, RFC 2606 for the .invalid TLD) so nothing here looks like real
traffic if you ever paste it somewhere.
"""
import struct


def checksum16(data: bytes) -> int:
    """The Internet checksum (RFC 1071): 16-bit ones'-complement sum."""
    if len(data) % 2:
        data += b"\x00"
    total = 0
    for i in range(0, len(data), 2):
        word = (data[i] << 8) + data[i + 1]
        total += word
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF


def build_ethernet_header(dst_mac: bytes, src_mac: bytes, ethertype: int) -> bytes:
    # 14 bytes: dst MAC(6) + src MAC(6) + EtherType(2)
    return struct.pack("!6s6sH", dst_mac, src_mac, ethertype)


def build_ipv4_header(src_ip: str, dst_ip: str, payload_len: int) -> bytes:
    version_ihl = (4 << 4) | 5  # IPv4, header length = 5 * 4 = 20 bytes
    tos = 0
    total_length = 20 + payload_len  # IP header + everything after it
    identification = 0x1C46  # arbitrary, would normally increment per datagram
    flags_frag = 0x4000  # Don't Fragment flag set, no fragment offset
    ttl = 64
    protocol = 6  # TCP
    src_bytes = bytes(int(o) for o in src_ip.split("."))
    dst_bytes = bytes(int(o) for o in dst_ip.split("."))

    header_without_checksum = struct.pack(
        "!BBHHHBBH4s4s",
        version_ihl, tos, total_length, identification, flags_frag,
        ttl, protocol, 0,  # checksum placeholder
        src_bytes, dst_bytes,
    )
    csum = checksum16(header_without_checksum)
    return struct.pack(
        "!BBHHHBBH4s4s",
        version_ihl, tos, total_length, identification, flags_frag,
        ttl, protocol, csum,
        src_bytes, dst_bytes,
    )


def build_tcp_header(src_port: int, dst_port: int, seq: int, ack: int, flags: int) -> bytes:
    data_offset = (5 << 4)  # 5 * 4 = 20 bytes, no TCP options
    window = 64240
    checksum = 0  # a REAL TCP checksum needs a pseudo-header (src/dst IP +
    # protocol + TCP length) mixed in -- see DECISIONS.md for why this
    # script leaves it at 0 rather than half-implementing it
    urgent_ptr = 0
    return struct.pack(
        "!HHLLHHHH",
        src_port, dst_port, seq, ack,
        data_offset << 8 | flags, window, checksum, urgent_ptr,
    )


def hexdump_annotated(frame: bytes, boundaries: list):
    """boundaries: list of (label, start, end) byte ranges to annotate."""
    print(f"Total frame size: {len(frame)} bytes\n")
    for label, start, end in boundaries:
        chunk = frame[start:end]
        hexstr = " ".join(f"{b:02x}" for b in chunk)
        print(f"--- {label}  (bytes {start}-{end - 1}, {end - start} bytes) ---")
        print(hexstr)
        print()


def main():
    dst_mac = bytes.fromhex("deadbeef0001")
    src_mac = bytes.fromhex("deadbeef0002")
    eth = build_ethernet_header(dst_mac, src_mac, ethertype=0x0800)  # 0x0800 = IPv4

    payload = b"GET /layer-demo HTTP/1.1\r\nHost: example.invalid\r\n\r\n"

    tcp = build_tcp_header(
        src_port=51820, dst_port=8080, seq=1000, ack=0, flags=0x02  # SYN flag
    )

    ip = build_ipv4_header(
        src_ip="192.0.2.10", dst_ip="192.0.2.20",
        payload_len=len(tcp) + len(payload),
    )

    frame = eth + ip + tcp + payload

    boundaries = [
        ("LAYER 2 -- Ethernet header (Data Link)", 0, 14),
        ("LAYER 3 -- IPv4 header (Network)", 14, 34),
        ("LAYER 4 -- TCP header (Transport)", 34, 54),
        ("LAYER 7 -- HTTP request (Application)", 54, len(frame)),
    ]
    hexdump_annotated(frame, boundaries)

    print("Readable summary:")
    print(f"  Ethernet : {src_mac.hex(':')} -> {dst_mac.hex(':')}, EtherType 0x0800 (IPv4)")
    ip_total_length = 20 + len(tcp) + len(payload)  # IP header's own field: everything AFTER the Ethernet header
    print(f"  IPv4     : 192.0.2.10 -> 192.0.2.20, protocol 6 (TCP), total length {ip_total_length} (IP header + TCP header + payload -- Ethernet's 14 bytes are never counted here)")
    print(f"  TCP      : port 51820 -> 8080, flags 0x02 (SYN), seq=1000")
    print(f"  HTTP     : {payload.splitlines()[0].decode()}")
    print()
    print("Notice there is no 'Layer 5/6' bytes anywhere in this frame --")
    print("Session and Presentation are OSI-model concepts with no dedicated")
    print("header in the TCP/IP stack actually used on the wire. That's the")
    print("core reason this module's title says 'For Real': OSI is a")
    print("teaching model, TCP/IP is what's actually encapsulated.")


if __name__ == "__main__":
    main()
