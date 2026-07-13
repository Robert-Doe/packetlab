"""
Module 19 -- validates a capstone project manifest for completeness and,
more importantly, CONSISTENCY: does your firewall configuration actually
implement the isolation plan you designed? Did every vulnerability you
found actually get remediated, or just logged and forgotten? Is your
monitoring actually watching for more than one thing?

This is the same category of check as Module 09's VLAN plan and Module
17's security-group auditor, applied to your own final project instead of
synthetic sample data -- the checker doesn't know or care whether your
project is "good" in some subjective sense; it checks whether the pieces
you claim to have built are actually consistent with each other.

Usage:
    python capstone_checker.py my_manifest.json
"""
import json
import sys


def check_network_consistency(manifest: dict) -> list:
    """Every VLAN isolation rule you DESIGNED should have a matching
    firewall rule you actually WROTE -- a plan with no enforcement is
    just a diagram."""
    issues = []
    network = manifest.get("network", {})
    vlans = network.get("vlans", [])
    firewall_rules = network.get("firewall_rules", [])

    firewall_pairs = {(r["from"], r["to"], r["action"]) for r in firewall_rules}

    for vlan in vlans:
        for rule in vlan.get("isolation_rules", []):
            key = (rule["from"], rule["to"], rule["action"])
            if key not in firewall_pairs:
                issues.append(
                    f"VLAN '{vlan['name']}' declares isolation rule "
                    f"{rule['from']} -> {rule['to']} ({rule['action']}) but no matching "
                    f"firewall rule was found -- the plan isn't enforced."
                )
    return issues


def check_monitoring(manifest: dict) -> list:
    issues = []
    monitoring = manifest.get("monitoring", {})
    if not monitoring.get("siem_active"):
        issues.append("SIEM/monitoring pipeline is not marked active.")
    detectors = monitoring.get("detectors", [])
    if len(detectors) < 2:
        issues.append(f"Only {len(detectors)} detector type(s) active -- expected at least 2 "
                       f"(e.g. port_scan + beaconing, per Module 14).")
    return issues


def check_vulnerabilities(manifest: dict) -> list:
    issues = []
    findings = manifest.get("vulnerability_assessment", {}).get("findings", [])
    if not findings:
        issues.append("No vulnerability assessment findings recorded at all -- "
                       "did you actually run a scan (Module 16)?")
    for f in findings:
        if not f.get("remediated"):
            issues.append(f"Finding '{f.get('id', '?')}' ({f.get('description', '')}) "
                           f"was never marked remediated.")
    return issues


def check_incident_report(manifest: dict) -> list:
    issues = []
    report = manifest.get("incident_report", {})
    word_count = report.get("word_count", 0)
    if word_count < 150:
        issues.append(f"Incident report is only {word_count} words -- a real incident report "
                       f"(Module 18) needs enough detail to stand alone: what happened, in what "
                       f"order, what evidence supports each claim.")
    return issues


def run_checker(manifest: dict) -> dict:
    all_issues = []
    all_issues += check_network_consistency(manifest)
    all_issues += check_monitoring(manifest)
    all_issues += check_vulnerabilities(manifest)
    all_issues += check_incident_report(manifest)

    total_checks = 4
    checks_with_issues = len({
        "network" if any("VLAN" in i for i in all_issues) else None,
        "monitoring" if any("SIEM" in i or "detector" in i for i in all_issues) else None,
        "vulns" if any("emediat" in i or "assessment" in i for i in all_issues) else None,
        "incident" if any("Incident report" in i for i in all_issues) else None,
    } - {None})
    completeness_pct = round(100 * (total_checks - checks_with_issues) / total_checks)

    return {"issues": all_issues, "completeness_pct": completeness_pct}


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "sample_manifest_complete.json"
    with open(path) as f:
        manifest = json.load(f)

    result = run_checker(manifest)
    print(f"Capstone checker -- {path}\n")
    print(f"Completeness: {result['completeness_pct']}%\n")

    if not result["issues"]:
        print("No gaps found. Every section is present and internally consistent.")
    else:
        print(f"{len(result['issues'])} gap(s) found:")
        for issue in result["issues"]:
            print(f"  - {issue}")


if __name__ == "__main__":
    main()
