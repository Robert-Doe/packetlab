"""
disclosure_timeline_checker.py

Validates a coordinated vulnerability disclosure (CVD) timeline against
real, widely-used disclosure norms -- the same "90-day standard
disclosure window" convention Google Project Zero and many CERTs
publish. This performs REAL date arithmetic on REAL dates you provide,
not a simulation -- feed it your own dates (from a real disclosure you
did, or a hypothetical one for your capstone/comprehensive exam prep)
and it will flag genuine ordering and timing violations.

Standard CVD norms this checker enforces:
  1. The vendor must be contacted ON OR AFTER the discovery date
     (you can't notify about something before you found it).
  2. Public disclosure must happen ON OR AFTER vendor contact
     (never disclose to the public before giving the vendor a chance).
  3. If no patch has been released, public disclosure before the
     standard 90-day window has elapsed since vendor contact is flagged
     as a deviation from the norm (not illegal, but worth justifying
     explicitly -- e.g. active exploitation in the wild is a recognized
     reason to disclose early).
  4. If a patch WAS released, disclosing significantly before the patch
     gives users no time to update -- flagged if disclosure happens more
     than a few days before the patch date.

Usage:
    python disclosure_timeline_checker.py sample_disclosure_complete.json
"""
import json
import sys
from datetime import date, datetime

STANDARD_WINDOW_DAYS = 90
PATCH_LEAD_TOLERANCE_DAYS = 3


def parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def check_timeline(entry: dict) -> list:
    issues = []
    discovery = parse_date(entry["discovery_date"])
    vendor_contacted = entry.get("vendor_contacted_date")
    public_disclosure = parse_date(entry["public_disclosure_date"])
    patch_released = entry.get("patch_released_date")

    if not vendor_contacted:
        issues.append(
            "No vendor_contacted_date at all -- this is FULL DISCLOSURE, "
            "not COORDINATED disclosure. Not automatically wrong, but a "
            "deliberate choice that should be justified explicitly, not "
            "an accidental omission."
        )
        return issues

    vendor_contacted_d = parse_date(vendor_contacted)

    if vendor_contacted_d < discovery:
        issues.append(
            f"vendor_contacted_date ({vendor_contacted}) is BEFORE "
            f"discovery_date ({entry['discovery_date']}) -- impossible "
            f"timeline, check your dates."
        )

    if public_disclosure < vendor_contacted_d:
        issues.append(
            f"public_disclosure_date ({entry['public_disclosure_date']}) "
            f"is BEFORE vendor_contacted_date ({vendor_contacted}) -- this "
            f"is full disclosure with no coordination window at all, the "
            f"single most common way researchers unintentionally cause "
            f"vendor/legal friction."
        )

    days_to_disclosure = (public_disclosure - vendor_contacted_d).days

    if not patch_released:
        if days_to_disclosure < STANDARD_WINDOW_DAYS:
            issues.append(
                f"Public disclosure happened {days_to_disclosure} day(s) "
                f"after vendor contact, before both the standard "
                f"{STANDARD_WINDOW_DAYS}-day window AND before any patch "
                f"was released. This deviates from standard CVD norms -- "
                f"legitimate reasons exist (active exploitation observed "
                f"in the wild, vendor unresponsive), but the reason should "
                f"be documented explicitly, not implicit."
            )
    else:
        patch_d = parse_date(patch_released)
        lead_days = (public_disclosure - patch_d).days
        if lead_days < -PATCH_LEAD_TOLERANCE_DAYS:
            issues.append(
                f"public_disclosure_date is {abs(lead_days)} day(s) BEFORE "
                f"patch_released_date -- users are told about the "
                f"vulnerability before they have any way to protect "
                f"themselves. Standard practice is to disclose ON or "
                f"shortly AFTER patch release, not before."
            )

    return issues


def run_checker(manifest: dict) -> dict:
    all_issues = []
    entries = manifest.get("disclosures", [])
    for entry in entries:
        entry_issues = check_timeline(entry)
        for issue in entry_issues:
            all_issues.append(f"[{entry.get('id', '?')}] {issue}")

    clean_count = len(entries) - len({
        i.split("]")[0][1:] for i in all_issues
    })
    completeness_pct = round(100 * clean_count / len(entries)) if entries else 0

    return {"issues": all_issues, "completeness_pct": completeness_pct, "total_entries": len(entries)}


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "sample_disclosure_complete.json"
    with open(path) as f:
        manifest = json.load(f)

    result = run_checker(manifest)
    print(f"Disclosure timeline checker -- {path}\n")
    print(f"{result['total_entries']} disclosure(s) checked. "
          f"{result['completeness_pct']}% fully compliant with standard CVD norms.\n")

    if not result["issues"]:
        print("No timeline issues found.")
    else:
        print(f"{len(result['issues'])} issue(s) found:")
        for issue in result["issues"]:
            print(f"  - {issue}")


if __name__ == "__main__":
    main()
