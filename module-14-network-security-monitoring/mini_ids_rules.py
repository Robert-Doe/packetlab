"""
Module 14 -- a tiny Suricata/Snort-style signature engine: parses real
rule syntax (the same `alert ... (msg:"..."; content:"..."; sid:...;)`
format Suricata and Snort both use) and matches those rules against a
stream of packet payloads.

This is a genuine subset of the real rule language, not an invented one --
a rule written here would need only cosmetic changes (mostly protocol/
port matching this engine simplifies to "any any") to run unmodified on
real Suricata.
"""
import re


def parse_rule(rule_text: str) -> dict:
    """Parses: alert tcp any any -> any any (msg:"..."; content:"..."; sid:123;)"""
    header_match = re.match(r"^(\w+)\s+(\w+)\s+(\S+)\s+(\S+)\s*->\s*(\S+)\s+(\S+)\s*\((.*)\)\s*$", rule_text.strip())
    if not header_match:
        raise ValueError(f"couldn't parse rule: {rule_text!r}")

    action, proto, src, src_port, dst, dst_port, options_text = header_match.groups()

    options = {}
    for opt in options_text.split(";"):
        opt = opt.strip()
        if not opt:
            continue
        if ":" in opt:
            key, _, value = opt.partition(":")
            options[key.strip()] = value.strip().strip('"')
        else:
            options[opt] = True

    return {
        "action": action, "proto": proto, "src": src, "src_port": src_port,
        "dst": dst, "dst_port": dst_port, "msg": options.get("msg", ""),
        "content": options.get("content"), "sid": options.get("sid"),
        "nocase": "nocase" in options,
    }


def match_rule(rule: dict, payload: str) -> bool:
    if rule["content"] is None:
        return False
    haystack = payload.lower() if rule["nocase"] else payload
    needle = rule["content"].lower() if rule["nocase"] else rule["content"]
    return needle in haystack


def run_engine(rules: list, packets: list):
    alerts = []
    for i, packet in enumerate(packets):
        for rule in rules:
            if match_rule(rule, packet):
                alerts.append({"packet_index": i, "payload": packet, "sid": rule["sid"], "msg": rule["msg"]})
    return alerts


DEFAULT_RULES_TEXT = [
    'alert tcp any any -> any any (msg:"Possible SQL injection attempt"; content:"OR 1=1"; nocase; sid:1000001;)',
    'alert tcp any any -> any any (msg:"Possible directory traversal"; content:"../../etc/passwd"; sid:1000002;)',
    'alert http any any -> any any (msg:"Suspicious User-Agent: sqlmap"; content:"sqlmap"; nocase; sid:1000003;)',
    'alert tcp any any -> any any (msg:"Cleartext password field"; content:"password="; nocase; sid:1000004;)',
]

SAMPLE_TRAFFIC = [
    "GET /search?q=laptops HTTP/1.1\r\nHost: shop.example",
    "GET /login?user=admin&password=hunter2 HTTP/1.1\r\nHost: shop.example",
    "GET /products?id=5 OR 1=1-- HTTP/1.1\r\nHost: shop.example",
    "GET /files?path=../../etc/passwd HTTP/1.1\r\nHost: shop.example",
    "GET /api/status HTTP/1.1\r\nHost: shop.example\r\nUser-Agent: Mozilla/5.0",
    "GET /admin HTTP/1.1\r\nHost: shop.example\r\nUser-Agent: sqlmap/1.7.2",
    "GET /about HTTP/1.1\r\nHost: shop.example",
]


def main():
    rules = [parse_rule(r) for r in DEFAULT_RULES_TEXT]
    print(f"Loaded {len(rules)} rules:")
    for r in rules:
        print(f"  sid:{r['sid']} -- {r['msg']}")

    print(f"\nScanning {len(SAMPLE_TRAFFIC)} packets of sample traffic...\n")
    alerts = run_engine(rules, SAMPLE_TRAFFIC)

    if not alerts:
        print("No alerts.")
    for a in alerts:
        print(f"ALERT [sid:{a['sid']}] {a['msg']}")
        print(f"  packet #{a['packet_index']}: {a['payload'][:70]}")
        print()

    print(f"{len(alerts)} alert(s) out of {len(SAMPLE_TRAFFIC)} packets inspected.")


if __name__ == "__main__":
    main()
