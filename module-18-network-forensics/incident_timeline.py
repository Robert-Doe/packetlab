"""
Module 18 -- reconstructs a human-readable incident timeline from a
.pcap file, annotating each phase of an attack: reconnaissance, exploit
attempt, and exfiltration. This is Module 14's detection reasoning
(port-scan and large-transfer patterns) applied retrospectively to a
saved capture, instead of live/statistical detection -- the actual job of
an incident responder handed a pcap after the fact and asked "what
happened here, in order?"
"""
from collections import defaultdict

from pcap_reader import parse_frame, read_pcap

KNOWN_BAD_PAYLOADS = {
    b"smiley:)": "vsftpd 2.3.4 backdoor trigger string (CVE-2011-2523, same CVE as Module 16's database)",
}


def annotate_packet(pkt, parsed) -> str:
    for pattern, description in KNOWN_BAD_PAYLOADS.items():
        if pattern in parsed["payload"]:
            return f"EXPLOIT ATTEMPT -- payload matches known-bad pattern: {description}"
    return None


def detect_recon(packets_parsed, window_seconds=1.0, min_ports=4):
    by_src_dst = defaultdict(list)
    for ts, p in packets_parsed:
        if p["tcp_flags"] == 0x02:  # SYN only
            by_src_dst[(p["src_ip"], p["dst_ip"])].append((ts, p["dst_port"]))

    findings = []
    for (src, dst), events in by_src_dst.items():
        events.sort()
        ports = {port for ts, port in events if ts - events[0][0] <= window_seconds}
        if len(ports) >= min_ports:
            findings.append({
                "type": "reconnaissance", "src": src, "dst": dst,
                "ports_touched": sorted(ports), "start_ts": events[0][0],
            })
    return findings


def detect_exfiltration(packets_parsed, min_packets=10):
    by_src_dst_port = defaultdict(list)
    for ts, p in packets_parsed:
        if p["payload"]:
            by_src_dst_port[(p["src_ip"], p["dst_ip"], p["dst_port"])].append((ts, len(p["payload"])))

    findings = []
    for (src, dst, port), events in by_src_dst_port.items():
        if len(events) >= min_packets:
            total_bytes = sum(size for ts, size in events)
            findings.append({
                "type": "exfiltration", "src": src, "dst": dst, "port": port,
                "packet_count": len(events), "total_bytes": total_bytes, "start_ts": events[0][0],
            })
    return findings


def build_timeline(path: str):
    meta, packets = read_pcap(path)
    packets_parsed = [(pkt["ts"], parse_frame(pkt["frame"])) for pkt in packets]

    events = []

    recon_findings = detect_recon(packets_parsed)
    for f in recon_findings:
        events.append((f["start_ts"], f"RECONNAISSANCE: {f['src']} scanned {len(f['ports_touched'])} "
                                       f"ports on {f['dst']} ({f['ports_touched']})"))

    for ts, p in packets_parsed:
        note = annotate_packet((ts, p), p)
        if note:
            events.append((ts, f"{p['src_ip']}:{p['src_port']} -> {p['dst_ip']}:{p['dst_port']} -- {note}"))

    exfil_findings = detect_exfiltration(packets_parsed)
    for f in exfil_findings:
        if f["dst"] not in {"10.0.0.50"}:  # don't flag legitimate inbound-heavy traffic to the victim itself
            events.append((f["start_ts"], f"EXFILTRATION: {f['src']} sent {f['packet_count']} packets "
                                           f"({f['total_bytes']} bytes) to {f['dst']}:{f['port']} -- "
                                           f"likely data exfiltration to an external host"))

    events.sort(key=lambda e: e[0])
    return events


def main():
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "incident.pcap"

    events = build_timeline(path)
    print(f"Incident timeline reconstructed from {path}:\n")
    t0 = events[0][0] if events else 0
    for ts, description in events:
        print(f"[T+{ts - t0:7.2f}s] {description}")


if __name__ == "__main__":
    main()
