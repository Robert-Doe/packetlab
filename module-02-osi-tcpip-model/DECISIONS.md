# Design Decisions — Module 02

## Why struct/Buffer byte-building instead of scapy

Scapy is the standard tool for exactly this kind of header construction,
but it also requires raw-socket privileges (admin/root + Npcap on Windows)
to actually send anything, and pulling in a whole packet-crafting library
just to print bytes that are never transmitted would hide the mechanics
this module is trying to teach. `struct.pack`/Node's `Buffer` force the
student to specify every byte's position and width explicitly — that
friction is the lesson. Module 09+ (once the course is working inside an
isolated lab VLAN with elevated privileges deliberately granted) is a more
appropriate place to introduce scapy for actual frame injection.

## Why the frame in layer_builder.py is never actually sent

Sending it would require raw sockets (admin/root, Npcap on Windows), turning
a zero-privilege exercise into a privileged one for no pedagogical gain —
the goal here is "understand what the bytes mean," not "successfully
inject a crafted frame," which is a Module 09+ concern once we're
inside an isolated lab environment with elevated privileges deliberately
granted. Keeping this module's code entirely unprivileged also means it
runs identically on a locked-down corporate laptop as it does on a fully
administered home machine.

## Why documentation-reserved addresses (RFC 5737, RFC 2606, locally-administered MAC)

`192.0.2.0/24` (TEST-NET-1) and `.invalid` are reserved by IANA/IETF
specifically so example code never accidentally resembles a real,
routable address. The MAC prefix `de:ad:be:ef` isn't a real IEEE-assigned
OUI — no NIC vendor owns it — so these frames can't be mistaken for a real
device's traffic if they ever end up pasted somewhere.

## Why traffic_generator.py uses raw `socket` instead of `requests`

`requests` (or Node's `fetch`) would hide the exact moment the TCP handshake
happens behind a single `.get()` call. Using `socket.socket()` +
`.connect()` + `.sendall()` + `.recv()` + `.close()` directly makes each of
the 5 network-visible events in this module map onto a specific line of
code the student wrote themselves, which is what Step 3 of the tutorial
asks them to correlate against a live Wireshark capture.

## Why no TCP checksum is computed

A correct TCP checksum requires building a "pseudo-header" (source IP,
destination IP, protocol number, and TCP length, none of which are part of
the TCP header itself) and summing it together with the real header and
payload — correct, but a detour from this module's actual point, which is
header *layout*, not checksum arithmetic. The IP header checksum, which
only checksums the IP header itself, was included because it required no
extra pseudo-header concept and demonstrates the same Internet-checksum
algorithm (RFC 1071) the student will see named again in Module 03 and 05.
Adding a correct TCP checksum is listed as a stretch exercise for a
student who wants to fully round this out.

## Why Wireshark (external) rather than a course-provided capture tool

Building a cross-platform packet capture GUI from scratch would be a
multi-week project in itself with no teaching value — Wireshark already is
the industry-standard tool for this and every working network engineer or
security researcher already needs to be fluent in it. This course teaches
you to use it well rather than reinventing a worse version of it.
