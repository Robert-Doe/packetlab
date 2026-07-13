"""
Module 14 -- analyzes a real-format Zeek conn.log for two classic
detection patterns: port scanning and beaconing. This script has NO
advance knowledge of which lines in conn.log are "the attack" -- it finds
them using the same statistical reasoning a real NSM analyst (or Zeek's
own scripting layer) would apply to any conn.log, from any network.
"""
import statistics
import sys
from collections import defaultdict


def parse_conn_log(path):
    rows = []
    with open(path) as f:
        for line in f:
            if line.startswith("#"):
                continue
            parts = line.rstrip("\n").split("\t")
            ts, uid, orig_h, orig_p, resp_h, resp_p, proto, service, duration, orig_bytes, resp_bytes = parts
            rows.append({
                "ts": float(ts), "uid": uid, "orig_h": orig_h, "orig_p": int(orig_p),
                "resp_h": resp_h, "resp_p": int(resp_p), "proto": proto, "service": service,
                "duration": float(duration), "orig_bytes": int(orig_bytes), "resp_bytes": int(resp_bytes),
            })
    return rows


def detect_port_scans(rows, window_seconds=10, min_distinct_ports=15):
    """A source touching many distinct destination ports on one target,
    within a short time window, with near-zero bytes transferred, is the
    classic signature of a port scan."""
    by_src_dst = defaultdict(list)
    for r in rows:
        by_src_dst[(r["orig_h"], r["resp_h"])].append(r)

    findings = []
    for (src, dst), conns in by_src_dst.items():
        conns.sort(key=lambda r: r["ts"])
        window_ports = set()
        window_start_ts = None
        for r in conns:
            if window_start_ts is None or r["ts"] - window_start_ts > window_seconds:
                window_start_ts = r["ts"]
                window_ports = set()
            window_ports.add(r["resp_p"])
            if len(window_ports) >= min_distinct_ports:
                findings.append({
                    "type": "port_scan", "src": src, "dst": dst,
                    "distinct_ports": len(window_ports), "window_seconds": window_seconds,
                    "first_ts": window_start_ts,
                })
                break
    return findings


def detect_beaconing(rows, min_occurrences=6, max_jitter_ratio=0.15, min_interval_seconds=1.0):
    """Connections to the same destination, on the SAME destination port,
    at suspiciously REGULAR intervals (low variance relative to the mean
    interval) is the classic signature of malware "calling home" on a
    timer, versus normal human browsing, which is bursty and irregular.

    Two refinements beyond "just check timing regularity" matter here,
    both added after this module's own testing showed why:
      - same destination PORT required: a fast port scan is also
        perfectly regular in timing but hits a DIFFERENT port each time --
        requiring port constancy is what actually distinguishes "beacon"
        from "scan," rather than timing alone.
      - min_interval_seconds excludes scan-speed connections outright:
        real C2 beacons operate on the order of seconds to minutes
        between check-ins, not milliseconds.
    """
    by_src_dst_port = defaultdict(list)
    for r in rows:
        by_src_dst_port[(r["orig_h"], r["resp_h"], r["resp_p"])].append(r)

    findings = []
    for (src, dst, port), conns in by_src_dst_port.items():
        if len(conns) < min_occurrences:
            continue
        conns.sort(key=lambda r: r["ts"])
        intervals = [b["ts"] - a["ts"] for a, b in zip(conns, conns[1:])]
        if len(intervals) < min_occurrences - 1:
            continue
        mean_interval = statistics.mean(intervals)
        if mean_interval < min_interval_seconds:
            continue  # too fast to be a plausible beacon -- likely a scan instead
        stdev_interval = statistics.pstdev(intervals)
        jitter_ratio = stdev_interval / mean_interval if mean_interval else float("inf")

        if jitter_ratio <= max_jitter_ratio:
            findings.append({
                "type": "beaconing", "src": src, "dst": dst, "port": port,
                "occurrences": len(conns), "mean_interval_s": round(mean_interval, 2),
                "jitter_ratio": round(jitter_ratio, 3),
            })
    return findings


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "conn.log"
    rows = parse_conn_log(path)
    print(f"Loaded {len(rows)} connection records from {path}\n")

    print("=" * 70)
    print("Port scan detection")
    print("=" * 70)
    scans = detect_port_scans(rows)
    if not scans:
        print("  (none found)")
    for f in scans:
        print(f"  ALERT: {f['src']} touched {f['distinct_ports']} distinct ports on {f['dst']} "
              f"within {f['window_seconds']}s -- looks like a port scan")

    print()
    print("=" * 70)
    print("Beaconing detection")
    print("=" * 70)
    beacons = detect_beaconing(rows)
    if not beacons:
        print("  (none found)")
    for f in beacons:
        print(f"  ALERT: {f['src']} -> {f['dst']}:{f['port']}: {f['occurrences']} connections, "
              f"avg interval {f['mean_interval_s']}s, jitter ratio {f['jitter_ratio']} "
              f"(low jitter = suspiciously regular = possible C2 beacon)")


if __name__ == "__main__":
    main()
