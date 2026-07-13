"""
Module 18 -- writes a REAL, valid .pcap file (the classic libpcap format
-- the same file format Wireshark, tcpdump, and every packet analysis
tool reads) containing a synthetic but realistic incident: reconnaissance,
an exploit attempt, and data exfiltration. Every frame inside is built
byte-by-byte with struct, extending Module 02's layer_builder.py technique
one format higher -- a .pcap file is just a small global header followed
by (per-packet header + raw frame bytes), repeated.

Open the output file (incident.pcap) in real Wireshark to confirm it's
genuinely valid -- this isn't a proprietary format invented for this
course, it's the actual format described in the tcpdump/libpcap project's
own file format specification.
"""
import struct

PCAP_MAGIC = 0xA1B2C3D4
LINKTYPE_ETHERNET = 1


def ip_to_bytes(ip: str) -> bytes:
    return bytes(int(o) for o in ip.split("."))


def checksum16(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"
    total = sum((data[i] << 8) + data[i + 1] for i in range(0, len(data), 2))
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF


def build_frame(src_mac, dst_mac, src_ip, dst_ip, src_port, dst_port, flags, payload, seq=1000, ack=0):
    eth = struct.pack("!6s6sH", bytes.fromhex(dst_mac.replace(":", "")),
                       bytes.fromhex(src_mac.replace(":", "")), 0x0800)

    tcp_no_csum = struct.pack(
        "!HHLLHHHH", src_port, dst_port, seq, ack, (5 << 12) | flags, 64240, 0, 0
    ) + payload

    ip_no_csum = struct.pack(
        "!BBHHHBBH4s4s", 0x45, 0, 20 + len(tcp_no_csum), 0x1c46, 0x4000, 64, 6, 0,
        ip_to_bytes(src_ip), ip_to_bytes(dst_ip),
    )
    ip_csum = checksum16(ip_no_csum)
    ip = struct.pack(
        "!BBHHHBBH4s4s", 0x45, 0, 20 + len(tcp_no_csum), 0x1c46, 0x4000, 64, 6, ip_csum,
        ip_to_bytes(src_ip), ip_to_bytes(dst_ip),
    )

    return eth + ip + tcp_no_csum


def write_pcap(path: str, packets: list):
    """packets: list of (timestamp_float, frame_bytes)"""
    with open(path, "wb") as f:
        f.write(struct.pack("!IHHiIII", PCAP_MAGIC, 2, 4, 0, 0, 65535, LINKTYPE_ETHERNET))
        # NOTE: real libpcap global headers are written in the HOST's native
        # byte order, with the magic number itself indicating which order a
        # reader should expect -- 0xA1B2C3D4 for big-endian-written files,
        # or a byte-swapped 0xD4C3B2A1 if written little-endian. This
        # writer always writes big-endian (network byte order) and the
        # matching magic number, which pcap_reader.py (and Wireshark) both
        # correctly interpret as "big-endian file."
        for ts, frame in packets:
            ts_sec = int(ts)
            ts_usec = round((ts - ts_sec) * 1_000_000)  # round, not truncate -- matches pcap_writer.js exactly
            f.write(struct.pack("!IIII", ts_sec, ts_usec, len(frame), len(frame)))
            f.write(frame)


def build_incident():
    attacker_mac, attacker_ip = "aa:bb:cc:00:00:66", "203.0.113.66"
    victim_mac, victim_ip = "aa:bb:cc:00:00:50", "10.0.0.50"
    exfil_mac, exfil_ip = "aa:bb:cc:00:00:99", "203.0.113.99"

    packets = []
    t = 1_700_000_000.0

    # --- Phase 1: reconnaissance -- a fast SYN scan across common ports ---
    for port in [21, 22, 80, 443, 3306, 8080]:
        t += 0.05
        frame = build_frame(attacker_mac, victim_mac, attacker_ip, victim_ip,
                             40000 + port, port, flags=0x02, payload=b"")  # SYN
        packets.append((t, frame))

    # --- Phase 2: exploit attempt -- FTP connection with a known-bad trigger ---
    t += 5.0
    frame = build_frame(attacker_mac, victim_mac, attacker_ip, victim_ip,
                         40021, 21, flags=0x18,  # PSH+ACK
                         payload=b"USER smiley:)\r\n")  # the real vsftpd 2.3.4 backdoor trigger pattern
    packets.append((t, frame))

    t += 0.2
    frame = build_frame(victim_mac, attacker_mac, victim_ip, attacker_ip,
                         21, 40021, flags=0x18, payload=b"220 (vsftpd 2.3.4)\r\n")
    packets.append((t, frame))

    # --- Phase 3: exfiltration -- large one-directional transfer to a 3rd host ---
    t += 30.0
    exfil_payload = b"CUSTOMER_DATA:" + (b"A" * 1400)  # simulate a large chunk
    for i in range(20):
        t += 0.02
        frame = build_frame(victim_mac, exfil_mac, victim_ip, exfil_ip,
                             55000 + i, 443, flags=0x18, payload=exfil_payload, seq=2000 + i * 1400)
        packets.append((t, frame))

    return packets


def main():
    packets = build_incident()
    write_pcap("incident.pcap", packets)
    print(f"Wrote incident.pcap with {len(packets)} packets spanning "
          f"{packets[-1][0] - packets[0][0]:.2f} seconds.")
    print("Open it in Wireshark to confirm it's a genuinely valid capture file.")


if __name__ == "__main__":
    main()
