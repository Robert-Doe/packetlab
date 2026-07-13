# Design Decisions — Module 10

## Why NAT and stateful firewall logic are combined in one class

On every real home router, PAT and stateful filtering are not separate
subsystems a packet passes through independently -- they're the same
conntrack/NAT pipeline in the Linux kernel (and the equivalent in pfSense's
underlying pf). Modeling them as one `NatFirewall` class with `outbound()`
creating both a NAT entry AND a connection-state entry in the same method
call reflects that reality more accurately than two separate classes would,
and sets up Scenario 4 naturally: a single inbound check has to consult
both tables to make its decision, exactly as it would need to on a real
router.

## Why Scenario 4 exists (spoofed source, real port)

Scenario 3 alone (completely unmatched port) might leave a student
thinking the firewall's check is just "is this external port currently
assigned to anyone" -- which would be a real, exploitable weakness if it
were true (an attacker could send traffic to a real assigned port and have
it forwarded to whatever internal host is using it). Scenario 4
demonstrates the firewall checking the FULL tuple, including source, which
is what actually prevents this -- and is worth calling out explicitly
because it's the detail simplified explanations of NAT often skip.

## Why external ports start at 40000

Real ephemeral/NAT port ranges vary by OS and router vendor but commonly
sit somewhere in the upper range (many Linux systems default to
32768-60999 for `ip_local_port_range`, and NAT implementations often use a
similar upper range for translated ports). 40000 was chosen as a
recognizable, round starting point within that realistic upper range --
not the literal value any specific vendor uses, but representative of
"high, non-well-known port territory" rather than picking something
confusable with a real service port (like starting at 8080).

## Why iptables_reference.html shows both iptables and nftables syntax

iptables is still what most existing tutorials, forum answers, and
production systems use, and remains fully functional on current Linux
distributions -- a student will encounter it constantly. nftables is the
modern replacement and increasingly the default on new distributions.
Showing both, side by side, for the exact same two rules (MASQUERADE and
stateful ACCEPT/DROP) lets the student recognize either syntax when they
encounter it in the wild, rather than learning one and being confused by
the other.

## Why this module doesn't include a runnable iptables demo

Real iptables/nftables rule manipulation requires Linux with root
privileges -- not available in this course's Windows-based build/test
environment, and risky to demonstrate as copy-paste commands a student
might run on their only Linux machine without understanding what each rule
does first. `nat_firewall_sim.py`/`.js` gives the tested, safe way to see
the LOGIC; `iptables_reference.html` gives the real syntax; Step 4 of the
tutorial explicitly frames actually running `iptables -L` as something to
try only if the student has a Linux VM available (their Module 09 lab
client VM), read-only (`-L`, listing existing rules) rather than modifying
anything.
