"""
research_notes_checker.py

Validates a research log against the minimum structure a real security
research writeup (or a comprehensive exam research proposal) needs --
the same completeness-and-consistency checking pattern as Module 19's
capstone_checker.py and Module 09's VLAN plan validator, applied to a
RESEARCH log instead of a network build.

This does not judge whether your research idea is GOOD -- it checks
whether the standard structural pieces (a stated question, related work,
a methodology, an ethics/threat-model statement, results, and stated
limitations) are actually present, the same floor-not-ceiling framing
Module 19 used.

Usage:
    python research_notes_checker.py sample_research_log_complete.json
"""
import json
import sys


def check_research_question(log: dict) -> list:
    issues = []
    rq = log.get("research_question", "").strip()
    if not rq:
        issues.append("No research question stated at all.")
    elif len(rq.split()) < 5:
        issues.append(
            f"Research question ('{rq}') is too short to be a real, "
            f"specific question -- a comprehensive exam question needs "
            f"enough specificity to be falsifiable, not just a topic name."
        )
    if not rq.rstrip().endswith("?"):
        issues.append("Research question does not end in '?' -- state it "
                       "as an actual question, not a topic statement.")
    return issues


def check_related_work(log: dict) -> list:
    issues = []
    related = log.get("related_work", [])
    if len(related) < 2:
        issues.append(
            f"Only {len(related)} related work entr(y/ies) -- a real "
            f"literature review needs enough prior work cited to show "
            f"you know what's already been done, not just one paper."
        )
    for i, entry in enumerate(related):
        if not entry.get("citation"):
            issues.append(f"related_work[{i}] has no citation.")
        if not entry.get("relevance"):
            issues.append(
                f"related_work[{i}] ({entry.get('citation', '?')}) has no "
                f"stated relevance -- citing a paper without saying HOW it "
                f"relates to your question is not a literature review."
            )
    return issues


def check_methodology(log: dict) -> list:
    issues = []
    methodology = log.get("methodology", {})
    if not methodology.get("description"):
        issues.append("No methodology description -- how would someone "
                       "else reproduce this work?")
    if not methodology.get("ethics_statement"):
        issues.append(
            "No ethics/authorization statement -- for security research "
            "specifically, this is not optional (see Module 16's "
            "authorization-boundary theory, and this module's "
            "responsible-disclosure material)."
        )
    return issues


def check_results_and_limitations(log: dict) -> list:
    issues = []
    results = log.get("results", {})
    if not results.get("summary"):
        issues.append("No results summary.")
    if not results.get("evidence"):
        issues.append(
            "Results claim findings but cite no evidence -- an unsupported "
            "claim is not a finding, the same evidence-to-conclusion "
            "standard Module 18's forensic reconstruction required."
        )
    limitations = log.get("limitations", [])
    if not limitations:
        issues.append(
            "No stated limitations -- every real study has some; a "
            "research writeup with zero acknowledged limitations reads as "
            "either incomplete or overconfident, both of which a "
            "comprehensive exam committee will notice."
        )
    return issues


def run_checker(log: dict) -> dict:
    all_issues = []
    all_issues += check_research_question(log)
    all_issues += check_related_work(log)
    all_issues += check_methodology(log)
    all_issues += check_results_and_limitations(log)

    total_checks = 4
    checks_with_issues = len({
        "question" if any("question" in i.lower() for i in all_issues) else None,
        "related" if any("related work" in i.lower() or "related_work" in i.lower() for i in all_issues) else None,
        "methodology" if any("methodology" in i.lower() or "ethics" in i.lower() for i in all_issues) else None,
        "results" if any("results" in i.lower() or "limitation" in i.lower() for i in all_issues) else None,
    } - {None})
    completeness_pct = round(100 * (total_checks - checks_with_issues) / total_checks)

    return {"issues": all_issues, "completeness_pct": completeness_pct}


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "sample_research_log_complete.json"
    with open(path) as f:
        log = json.load(f)

    result = run_checker(log)
    print(f"Research notes checker -- {path}\n")
    print(f"Completeness: {result['completeness_pct']}%\n")

    if not result["issues"]:
        print("No gaps found. Every section is present and structurally sound.")
    else:
        print(f"{len(result['issues'])} gap(s) found:")
        for issue in result["issues"]:
            print(f"  - {issue}")


if __name__ == "__main__":
    main()
