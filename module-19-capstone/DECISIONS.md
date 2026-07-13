# Design Decisions — Module 19

## Why the checker validates consistency, not subjective quality

`capstone_checker.py` cannot judge whether a student's network design is
"good" -- that requires human judgment this course's automated tooling
was never meant to replace (`capstone_rubric.html` is where subjective
judgment criteria live instead). What it CAN check mechanically, and does:
whether the pieces the student CLAIMS to have built are internally
consistent with each other -- a VLAN isolation rule with no matching
firewall rule, a vulnerability finding never marked remediated, monitoring
claimed active with zero detectors configured. This mirrors Module 09's
and Module 17's own auditor tools exactly, applied reflexively to the
student's own final project instead of sample data.

## Why both a complete and an intentionally incomplete sample manifest are provided

An auditor that's only ever been shown data it should pass provides no
evidence it can actually catch a real problem -- the same principle
Modules 14, 16, and 17 all applied with their own deliberately-broken test
cases. `sample_manifest_incomplete.json` was specifically constructed to
trip all 4 check categories at once (missing firewall rule, inactive
SIEM, single detector, unremediated finding, short report), and confirmed
during this module's testing to produce exactly 5 correct, specific gap
messages, with the completeness percentage correctly computed as 0% (all
4 categories affected) versus the complete manifest's 100%.

## Why completeness_pct is computed per-CATEGORY rather than per-issue

Counting raw issue count would let a manifest with many small issues in
one category score worse than a manifest with one issue in each of all 4
categories, even though the second is arguably the more broadly incomplete
project. Scoring by "how many of the 4 major areas have at least one gap"
gives a completeness signal that tracks BREADTH of completion across the
capstone's actual required areas (network, monitoring, vulnerabilities,
reporting), which is what the brief actually asks for -- covering all 5
requirement areas, not perfecting one while ignoring others.

## Why this module doesn't ship a pre-built "reference capstone"

Every other module in this course ships fully worked, tested code the
student runs and studies. This module deliberately doesn't, because the
entire point of a capstone is synthesizing the student's OWN design
decisions across the network they build -- a reference solution would
just become something to copy rather than a real demonstration that the
preceding 18 modules' lessons actually transferred. What IS provided
(the checker, the rubric, the playbook, the report template) is
infrastructure for the student's own project, not a substitute for it.

## Why the red-team playbook is the one place in the course that relaxes the "localhost only" scanner restriction

Module 16's `assert_safe_target()` hard-codes localhost specifically
because a general-purpose course module shipped to any student can't
assume what's authorized in their environment. The capstone is different:
by this point, the student has built their OWN isolated lab (Module 09),
and scanning THAT lab -- infrastructure they personally built, own, and
control -- is squarely within the same authorization boundary Module 16's
restriction was protecting in the first place. `red_team_blue_team_playbook.md`
says this explicitly rather than leaving the student to guess whether
modifying Module 16's scanner is appropriate here.
