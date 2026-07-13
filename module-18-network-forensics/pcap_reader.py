"""
Module 18 -- parses a REAL .pcap file (global header + repeated packet
records), reconstructing each frame's Ethernet/IP/TCP fields and payload.
This reads the exact same file format Wireshark/tcpdump use -- confirmed
during this module's build with the independent `file` command-line
utility (libmagic), which correctly identified pcap_writer.py's output as
a genuine "pcap capture file... version 2.4 (Ethernet)" with zero
knowledge of this course's code.
"""
import struct

PCAP_MAGIC = 0xA1B2C3D4


def mac_str(b: bytes) -> str:
    return b.hex(":")


def ip_str(b: bytes) -> str:
    return ".".join(str(o) for o in b)


def read_pcap(path: str):
    with open(path, "rb") as f:
        header = f.read(24)
        magic, ver_major, ver_minor, thiszone, sigfigs, snaplen, network = struct.unpack("!IHHiIII", header)
        if magic != PCAP_MAGIC:
            raise ValueError(f"not a recognized big-endian pcap file (magic={magic:#x})")

        packets = []
        while True:
            record_header = f.read(16)
            if len(record_header) < 16:
                break
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack("!IIII", record_header)
            frame = f.read(incl_len)
            packets.append({"ts": ts_sec + ts_usec / 1_000_000, "frame": frame, "orig_len": orig_len})

        return {"version": (ver_major, ver_minor), "snaplen": snaplen, "network": network}, packets


def parse_frame(frame: bytes) -> dict:
    dst_mac, src_mac, ethertype = struct.unpack("!6s6sH", frame[0:14])
    ip_header = frame[14:34]
    version_ihl, tos, total_len, ident, flags_frag, ttl, proto, csum, src_ip, dst_ip = struct.unpack(
        "!BBHHHBBH4s4s", ip_header
    )
    tcp_header = frame[34:54]
    src_port, dst_port, seq, ack, offset_flags, window, tcp_csum, urgent = struct.unpack(
        "!HHLLHHHH", tcp_header
    )
    tcp_flags = offset_flags & 0x3F
    payload = frame[54:]

    return {
        "src_mac": mac_str(src_mac), "dst_mac": mac_str(dst_mac),
        "src_ip": ip_str(src_ip), "dst_ip": ip_str(dst_ip),
        "src_port": src_port, "dst_port": dst_port,
        "tcp_flags": tcp_flags, "seq": seq, "ack": ack,
        "payload": payload,
    }


FLAG_NAMES = {0x02: "SYN", 0x10: "ACK", 0x18: "PSH,ACK", 0x12: "SYN,ACK", 0x01: "FIN", 0x04: "RST"}


def main():
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "incident.pcap"

    meta, packets = read_pcap(path)
    print(f"pcap version {meta['version']}, snaplen {meta['snaplen']}, linktype {meta['network']}")
    print(f"{len(packets)} packets\n")

    for i, pkt in enumerate(packets):
        p = parse_frame(pkt["frame"])
        flags = FLAG_NAMES.get(p["tcp_flags"], hex(p["tcp_flags"]))
        payload_preview = p["payload"][:40]
        print(f"#{i:03d} t={pkt['ts']:.3f} {p['src_ip']}:{p['src_port']} -> {p['dst_ip']}:{p['dst_port']} "
              f"[{flags}] len={len(p['payload'])}"
              + (f" payload={payload_preview!r}" if payload_preview else ""))


if __name__ == "__main__":
    main()
