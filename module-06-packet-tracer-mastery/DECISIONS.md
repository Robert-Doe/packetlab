# Design Decisions — Module 06

## Why this module can't include a tested, working Packet Tracer file

Packet Tracer's native `.pkt` project files are a proprietary binary
format tied to a licensed, GUI-only application. This course's build
process tests everything it hands you by actually running it — every
other module's code was executed and its output verified before being
included. That verification approach fundamentally does not work for a
GUI application requiring a windowed desktop session and a Cisco account.
Rather than pretend otherwise, this module is honest about that boundary:
it ships precisely-specified, IOS-syntax-correct build instructions (the
`topology_configs/*.md` files) plus a fully tested, JSON-driven answer key
(`topology_validator.py`/`.js`) that WAS verified the same way every other
module's code was.

## Why JSON topology files instead of hardcoding the topologies in Python

Module 05's `static_routing.py` hardcodes its topology directly in
`build_topology()` — appropriate there, since that module's whole point was
reading Python code that builds a network by hand. This module's validator
needed to serve THREE different topologies (and invites the student to add
a 4th, in Exercise 2) without duplicating the Router/lookup logic three
times. A JSON topology format keeps the validator generic and makes adding
a new topology a data-authoring task, not a code-editing one — closer to
how the student experiences Packet Tracer itself (describing a topology
through configuration, not writing simulation code).

## Why Topology 3 is deliberately identical to Module 05's addressing

The single strongest way to prove "what you configured on real IOS behaves
exactly like what you predicted with pure math" is to hold the topology
completely constant and change only the tool. A student who gets matching
output from `static_routing.py` (Module 05), `topology_validator.py`
(this module, JSON-driven), and Packet Tracer's actual `show ip route` (a
real, if simulated, IOS parser) has triangulated the same truth three
independent ways — which is considerably more convincing than any single
tool's output on its own.

## Why dotted-decimal masks appear in the IOS reference despite Module 04 using CIDR everywhere

Real Cisco IOS `ip route`/`ip address` commands require dotted-decimal
subnet masks (`255.255.255.0`), not CIDR notation (`/24`) -- this is a
genuine, unavoidable quirk of the actual command syntax, not a course
inconsistency. `ios_command_reference.html` calls this out explicitly
rather than silently using CIDR notation in a fake command example that
would fail if actually typed into a router.

## Why no attempt was made to "verify" the Cisco Skills for All signup flow

Downloading files and creating accounts on a student's behalf are both
explicitly out of scope for this course's tooling (see the top-level
project's action-category rules) -- Step 0 of the tutorial directs the
student to do this themselves, the same way it would for any other
external licensed tool. This course links to no specific download URL for
the same reason -- pointing at the current official signup path is the
student's own responsibility to verify, since Cisco's exact enrollment flow
can change over time in ways this document can't track.
