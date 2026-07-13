# Head First: A Capstone Isn't a New Skill. It's Every Old Skill, at Once.

## Nothing here is new. That's deliberate, and that's the test.

Look back at what `capstone_checker.py` actually checks: does your
firewall enforce your VLAN plan (Module 09/10), is your monitoring active
with multiple detectors (Module 14), was every vulnerability finding
actually remediated (Module 16), does your incident report have enough
substance to stand alone (Module 18). Every single check is a direct
callback to a module you already built and tested. The capstone doesn't
introduce a 19th mechanism to learn — it asks whether you can hold all 18
previous mechanisms in your head at once, working together, on a project
you designed yourself instead of one this course handed you pre-built.

**Brain power:** why does `check_network_consistency()` specifically check
whether your VLAN plan's isolation rules have MATCHING firewall rules,
rather than just checking that firewall rules exist at all? Because a
network with firewall rules that don't correspond to any actual design
decision isn't secure by accident — and a network with a design that was
never enforced isn't secure either, no matter how thoughtful the diagram
was. The check exists because "I designed it" and "I built it" are
different claims, and this entire course has tried to keep that
distinction sharp, module after module — Module 06 said this explicitly
about Packet Tracer, Module 15 said it explicitly about the ELK stack, and
here it is again, automated, checking YOUR final project the same way.

## The red/blue/forensics cycle is the entire course, compressed into one loop

Round 1 (cause an incident) is Modules 02, 07, 08, 12, 16 — building and
sending real traffic, real exploits, real payloads. Round 2 (detect it) is
Module 14/15 — the exact statistical reasoning you already tested against
synthetic data, now pointed at something real. Round 3 (reconstruct it
from evidence alone) is Module 18 — the same pcap parsing and timeline
logic, applied to a capture you made yourself instead of one this course
generated for you. Round 4 (remediate and re-verify) is Module 16's
vulnerability-matching loop, closed for real: found, fixed, CONFIRMED
fixed by trying the same attack again and watching it fail. If any single
piece of this cycle feels unfamiliar, that's useful information about
which earlier module deserves a second look before you consider the
capstone finished.

## Self-assessment is the actual professional skill being tested here

No instructor is grading this. `capstone_checker.py` catches objective
inconsistencies, but nothing forces you to write an honest incident
report, or to actually re-test a "remediated" vulnerability instead of
just marking the checkbox. This is deliberate: real security work rarely
comes with an external grader either. The professional skill that
separates "did the assignment" from "can be trusted with real systems" is
exactly this — holding yourself to a standard nobody's forcing on you,
because you understand why the standard exists.

## Self-test before considering this done

- Pick one component of your capstone build and explain, from memory, why
  you made the design decision you made — not what the decision was, but
  why it was the right one given what you now understand.
- Did you actually re-run your Round 1 attack after remediation, and
  confirm it failed? If not, do that now before marking anything
  "remediated" — a fix you haven't verified isn't a fix, it's a guess.
- If a stranger read only your incident report, with none of your other
  project files, would they understand what happened and why you believe
  it? If not, that's the report's actual bar, and it isn't met yet.
