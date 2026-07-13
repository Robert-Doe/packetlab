# Design Decisions — Module 03

## Why simulate a switch in software instead of requiring a real managed switch

Real managed switches capable of showing you a CAM table and VLAN config
cost real money and require physical Ethernet cabling most students won't
have on hand. A software simulation makes the exact same algorithm
(learn/flood/forward) inspectable with print statements at every step,
which a real switch's opaque ASIC never lets you see regardless of how much
the switch costs. Module 06 (Packet Tracer) is where topology-building with
simulated-but-realistic Cisco hardware takes over for students who want that
experience; this module is deliberately code-first instead, so the
algorithm itself — not a GUI — is what gets learned first.

## Why frames are real bytes (struct/Buffer) instead of Python dicts

It would be simpler to represent a "frame" as `{"src": ..., "dst": ...}`.
Building actual bytes with the same TPID/TCI 802.1Q layout a real NIC uses
means `parse_frame`/`parseFrame` has to do real bit-masking
(`tci & 0x0FFF`) to extract a 12-bit VLAN ID from a 16-bit field — which is
exactly the bit-fiddling a student will recognize immediately when reading
Wireshark's own VLAN tag breakdown later, or the 802.1Q spec directly. A
dict-based frame would never have taught that.

## Why the CAM table key is `(vlan_id, mac)` and not just `mac`

A real switch's forwarding table is per-VLAN — the same MAC address could
theoretically appear on different ports in different VLANs (unusual, but
architecturally the table has to support it). Keying by `(vlan, mac)` from
the start avoids a subtle bug where a MAC in one VLAN would falsely satisfy
a lookup for a different VLAN's frame — the exact bug this module's own JS
port hit during testing (the CAM-table dump used the MAC's own colons as a
key-splitting delimiter, silently truncating every address to `de`, its
first hex pair — fixed by switching the key delimiter to `|`). That bug is
left implicitly documented here because it's a good example of why explicit
delimiter choice matters whenever you build composite dictionary/Map keys
out of formatted strings.

## Why ARP replies are trusted unconditionally, with no verification

This isn't a simplification — it's how ARP (RFC 826) actually works on
every real network. Deliberately reproducing the lack of verification here
(rather than "fixing" it in the simulation) means the security implication
(ARP spoofing) is something the student derives themselves from reading
`_handle_arp`, rather than being told about it as an abstract fact in a
bullet list.

## Why no actual attack (ARP spoofing / MAC flooding) is implemented yet

This module's job is the mechanism, not the exploit. Exercise 3 asks the
student to *observe* CAM table growth under a flooding scenario, stopping
short of building a working attack — full offensive tooling belongs in a
module with proper scoping (isolated lab VLAN, explicit authorization
framing), which is Module 16's territory, once the underlying mechanism
here is second nature.

## Why no launchers run anything long-lived

Unlike Module 01/02, this module's code is a one-shot simulation that runs
to completion and exits — there's no server to keep alive, so `run.bat`
and the Makefile simply execute both variants back to back rather than
starting anything backgrounded.
