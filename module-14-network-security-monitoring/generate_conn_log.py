"""
Module 14 -- generates a synthetic Zeek-format conn.log: the exact
tab-separated field layout Zeek's real Network Security Monitor produces
for every connection it observes (a subset of Zeek's real fields -- ts,
uid, source/dest IP:port, protocol, service, duration, bytes).

Three traffic patterns are woven together, exactly the way a real day's
traffic would mix them:
  1. Normal browsing -- a couple of internal hosts making varied,
     unremarkable connections.
  2. A port scan -- one host rapidly touching many ports on one target,
     each connection near-instant with zero bytes transferred (a classic
     SYN-scan signature).
  3. Beaconing -- one host connecting to the same external destination at
     suspiciously regular intervals with near-constant byte counts (a
     classic C2 malware signature -- "call home every 60 seconds").

conn_log_analyzer.py's job is to find #2 and #3 in this file without being
told in advance which lines they are.
"""
import random

FIELDS = ["ts", "uid", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p",
          "proto", "service", "duration", "orig_bytes", "resp_bytes"]


def make_row(ts, uid, orig_h, orig_p, resp_h, resp_p, proto, service, duration, orig_bytes, resp_bytes):
    return "\t".join(str(x) for x in [
        f"{ts:.6f}", uid, orig_h, orig_p, resp_h, resp_p, proto, service,
        f"{duration:.6f}", orig_bytes, resp_bytes,
    ])


def generate(seed=42):
    random.seed(seed)
    rows = []
    t = 1_700_000_000.0
    uid_counter = 0

    def next_uid():
        nonlocal uid_counter
        uid_counter += 1
        return f"C{uid_counter:06x}"

    # --- 1. Normal traffic: two hosts, varied unremarkable connections ---
    for _ in range(15):
        t += random.uniform(2, 30)
        src = random.choice(["192.168.1.10", "192.168.1.20"])
        dst = random.choice(["93.184.216.34", "142.250.72.14", "151.101.1.69"])
        service, port = random.choice([("dns", 53), ("http", 80), ("ssl", 443)])
        rows.append(make_row(t, next_uid(), src, random.randint(49152, 65535), dst, port,
                              "tcp" if service != "dns" else "udp", service,
                              random.uniform(0.01, 2.5), random.randint(60, 2000), random.randint(200, 8000)))

    # --- 2. Port scan: 192.168.1.30 sweeps 40 ports on one target, fast ---
    scan_start = t + 5
    target = "192.168.1.99"
    for i, port in enumerate(random.sample(range(1, 1024), 40)):
        rows.append(make_row(scan_start + i * 0.05, next_uid(), "192.168.1.30", 51000 + i,
                              target, port, "tcp", "-", 0.0002, 0, 0))
    t = scan_start + 40 * 0.05

    # --- 3. Beaconing: 192.168.1.10 calls home every ~60s, tiny consistent payload ---
    beacon_start = t + 20
    for i in range(12):
        jitter = random.uniform(-1.5, 1.5)  # real beacons usually have SOME jitter
        rows.append(make_row(beacon_start + i * 60 + jitter, next_uid(), "192.168.1.10", 52000 + i,
                              "203.0.113.66", 443, "tcp", "ssl", 0.15,
                              random.randint(180, 220), random.randint(340, 380)))

    random.shuffle(rows)  # real logs aren't neatly grouped by "pattern"
    rows.sort(key=lambda r: float(r.split("\t")[0]))  # but ARE timestamp-ordered
    return rows


def main():
    rows = generate()
    with open("conn.log", "w") as f:
        f.write("#fields\t" + "\t".join(FIELDS) + "\n")
        for row in rows:
            f.write(row + "\n")
    print(f"Wrote conn.log with {len(rows)} connection records "
          f"(mixed: normal traffic + 1 port scan + 1 beaconing pattern).")


if __name__ == "__main__":
    main()
