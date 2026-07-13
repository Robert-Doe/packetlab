"""
Module 17 -- a real security review technique: auditing security group
rules for overly permissive access, before you ever run `terraform apply`.
This models the exact 3-tier security group structure from
terraform/main.tf (web/app/db) as JSON, plus a deliberately misconfigured
example, and flags exactly the mistake real cloud security reviews (and
tools like AWS Security Hub / Prowler) actually catch: a sensitive,
non-web port opened to the entire internet.
"""
import json

# Ports where 0.0.0.0/0 (the entire internet) is almost always a mistake,
# not a deliberate design choice -- unlike 80/443, which are SUPPOSED to
# be open to everyone for a public web tier.
SENSITIVE_PORTS = {
    22: "SSH", 3389: "RDP", 3306: "MySQL", 5432: "PostgreSQL",
    27017: "MongoDB", 6379: "Redis", 9200: "Elasticsearch", 5601: "Kibana",
}

WIDE_OPEN_CIDRS = {"0.0.0.0/0", "::/0"}


def audit_security_group(sg: dict) -> list:
    """sg: {"name": ..., "ingress": [{"from_port":, "to_port":, "cidr_blocks": [...] or "source_sg": "..."}]}"""
    findings = []
    for rule in sg.get("ingress", []):
        from_port, to_port = rule["from_port"], rule["to_port"]
        cidrs = rule.get("cidr_blocks", [])
        source_sg = rule.get("source_sg")

        if source_sg:
            continue  # referencing another security group, not a raw CIDR -- this is the GOOD pattern, never flagged

        wide_open = any(c in WIDE_OPEN_CIDRS for c in cidrs)
        if not wide_open:
            continue

        for port, service in SENSITIVE_PORTS.items():
            if from_port <= port <= to_port:
                findings.append({
                    "security_group": sg["name"], "severity": "critical",
                    "port": port, "service": service,
                    "issue": f"{service} (port {port}) is open to the entire internet (0.0.0.0/0)",
                })

        # A rule spanning ALL ports (0-65535) open to the internet is always
        # worth flagging regardless of which specific sensitive ports it contains.
        if from_port == 0 and to_port >= 65535:
            findings.append({
                "security_group": sg["name"], "severity": "critical",
                "port": f"{from_port}-{to_port}", "service": "ALL",
                "issue": "Every port is open to the entire internet (0.0.0.0/0) -- this rule has no meaningful restriction at all",
            })

    return findings


def audit_all(security_groups: list) -> list:
    findings = []
    for sg in security_groups:
        findings.extend(audit_security_group(sg))
    return findings


# Mirrors terraform/main.tf's real 3-tier structure, plus one deliberately
# misconfigured group to confirm the auditor actually catches a mistake.
SAMPLE_SECURITY_GROUPS = [
    {
        "name": "web-sg",
        "ingress": [
            {"from_port": 80, "to_port": 80, "cidr_blocks": ["0.0.0.0/0"]},
            {"from_port": 443, "to_port": 443, "cidr_blocks": ["0.0.0.0/0"]},
        ],
    },
    {
        "name": "app-sg",
        "ingress": [
            {"from_port": 8080, "to_port": 8080, "source_sg": "web-sg"},
        ],
    },
    {
        "name": "db-sg",
        "ingress": [
            {"from_port": 3306, "to_port": 3306, "source_sg": "app-sg"},
        ],
    },
    {
        "name": "db-sg-MISCONFIGURED-example",
        "ingress": [
            {"from_port": 3306, "to_port": 3306, "cidr_blocks": ["0.0.0.0/0"]},
            {"from_port": 22, "to_port": 22, "cidr_blocks": ["0.0.0.0/0"]},
        ],
    },
]


def main():
    print(f"Auditing {len(SAMPLE_SECURITY_GROUPS)} security groups "
          f"(matching terraform/main.tf's real 3-tier design, plus one bad example)...\n")

    findings = audit_all(SAMPLE_SECURITY_GROUPS)

    if not findings:
        print("No issues found.")
    for f in findings:
        print(f"[{f['severity'].upper()}] {f['security_group']}: {f['issue']}")

    print(f"\n{len(findings)} finding(s) across {len(SAMPLE_SECURITY_GROUPS)} security groups.")
    print("\nNotice web-sg, app-sg, and db-sg (the REAL terraform/main.tf design)")
    print("produced ZERO findings -- app-sg and db-sg use security-group references,")
    print("not raw CIDR blocks, which is exactly the pattern that keeps them off")
    print("this list. Only the deliberately misconfigured example was flagged.")


if __name__ == "__main__":
    main()
