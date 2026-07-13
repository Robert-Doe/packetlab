# Head First: A Switch Doesn't Know Anything Until It Overhears It

## Your switch is not configured with a map of your network

This surprises almost everyone the first time they hear it: a switch ships
from the factory with zero knowledge of which device is plugged into which
port. It builds that knowledge entirely by **eavesdropping on traffic that
was already going to happen anyway.**

Every frame that arrives has a source MAC address on it. The switch reads
that source address, notes "oh, this MAC is reachable via the port it just
came in on," and writes it into a table. That's the entire learning
algorithm. It never asks. It never scans. It just watches, and remembers
what it overhears — forever (well, until an aging timer clears it, which
Exercise 1 asks you to add yourself).

**Brain power:** in Scenario 1 of the simulator, the switch logged
"learned de:ad:be:ef:10:01 is on port 1" the INSTANT PC-A sent its ARP
broadcast — before PC-B had replied to anything. Why would the switch
already know PC-A's location from a frame PC-A sent asking a question, not
answering one? Because learning doesn't care about the frame's *purpose* —
it only reads the *source address* field, which every frame has,
regardless of whether it's a question, an answer, or ordinary data.

## Flooding is not a bug — it's the honest admission of "I don't know"

The first time a switch sees a destination MAC it has no entry for, it does
the only thing it safely can: send the frame out every other port on that
VLAN, and let whichever device recognizes its own MAC address keep it
(every other device just silently discards a frame not addressed to them —
or to broadcast). This looks wasteful, and it is, slightly — but it's also
the only correct behavior when you genuinely don't know where something
lives yet. Watch Scenario 1 again: PC-A's very first frame — an ARP
broadcast — necessarily gets flooded, because a broadcast destination
(`ff:ff:ff:ff:ff:ff`) is never in the CAM table by design. It's supposed to
reach everyone.

The subtler moment is Scenario 3: the exact same source and destination MAC
pair as Scenario 1, but now forwarded to one port only, because the switch
already learned the answer during Scenario 1's ARP exchange. Same
addresses, completely different behavior — because the switch's *state*
changed in between, not the frame itself.

## VLANs: the same flooding rule, with a fence added

A VLAN doesn't change the learning algorithm or the flooding algorithm at
all. It changes exactly one thing: **which ports count as "everyone" when
flooding happens.** That's it. That's the entire mechanism behind "VLANs
create separate broadcast domains" — a phrase you'll hear in every
networking certification and rarely see explained mechanically. Scenario 2
proved it: PC-A's broadcast for a VLAN-20 IP still floods — just only to
the other VLAN-10 port. VLAN 20's hosts never even see the frame exists.
No firewall, no ACL, no packet inspection happened. The switch's flood
loop just skipped ports whose VLAN tag didn't match.

## ARP: trusting the first answer that arrives

Notice `Host._handle_arp` (or `_handleArp` in JS) does something a little
reckless if you look closely: it caches whichever reply arrives first, for
whichever IP it claims to be answering for, with **no verification
whatsoever** that the reply is legitimate. This is exactly how real ARP
works too — there's no authentication built into the protocol at all. A
device on your LAN could claim to be your gateway's IP address with a
different MAC, and every other device would cache the lie exactly as
happily as the truth. This isn't a flaw in the simulator; it's a
faithfully-reproduced flaw in the real 1982 protocol (RFC 826), and it's
the entire basis of ARP spoofing / ARP cache poisoning attacks — which this
course does not build an exploit for in this module, but which you now
understand completely, mechanically, because you just watched the trust
assumption get made in your own code.

## Self-test before moving on

- Explain why a switch logs "learned" on a frame's SOURCE address but never
  on its DESTINATION address.
- Without re-running the simulator, predict: if PC-C (VLAN 20) sent its own
  ARP broadcast for PC-D's IP (also VLAN 20), would it succeed? Why?
- In one sentence, why is "the switch doesn't check whether an ARP reply is
  legitimate" not a bug in this simulator specifically, but a property of
  the real protocol it's modeling?
