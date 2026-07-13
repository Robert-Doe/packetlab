# Head First: OSI Is a Map, TCP/IP Is the Territory

## You memorized 7 layers. Real traffic only has 4 headers.

Every networking 101 class drills the same mnemonic — Please Do Not Throw
Sausage Pizza Away — Physical, Data Link, Network, Transport, Session,
Presentation, Application. Seven layers, seven boxes on a diagram.

Then you open Wireshark and look at a real packet. You get **Frame →
Ethernet II → Internet Protocol → TCP → HTTP.** Four things with actual
bytes, plus "Frame" which is just Wireshark's own bookkeeping, not a
header at all. Where did Session and Presentation go?

**They were never real headers.** OSI is a 1984 reference model built to
describe networking in the abstract, layer by layer, so vendors could
theoretically swap out any layer's implementation without touching the
others. TCP/IP is what actually shipped, and it collapsed Session,
Presentation, and Application into one layer because in practice, nothing
ever needed a byte-level boundary between "here's a session token" and
"here's how the bytes are encoded" and "here's the actual request." Your
application protocol (HTTP, DNS, SMTP) just handles all of that itself, in
whatever format it wants.

**Brain power:** you just ran `layer_builder.py` and got a 105-byte frame
with exactly 4 labeled sections. If OSI's 7 layers were real headers on the
wire, how many bytes would layers 5 and 6 need? The honest answer: however
many you invented, because there's no spec for them — you'd be making it up.
That's the tell. A layer with no header format isn't a layer you'll ever
find in a packet capture.

## Encapsulation: the only mental model you actually need

Forget the 7-layer chart for a second. Here's what's actually happening,
stated as one repeating rule:

> Each layer wraps the layer above it in its own header, and hands the
> whole thing down to the layer below.

HTTP request text gets wrapped in a TCP header (adds ports, sequence
numbers — "how do I make sure this arrives in order and gets
acknowledged"). That gets wrapped in an IP header (adds source/destination
addresses — "how do I get this across networks, not just this one wire").
That gets wrapped in an Ethernet header (adds MAC addresses — "how do I get
this across this one physical wire/segment specifically"). That's it.
That's encapsulation, and it's the entire reason `layer_builder.py` builds
frames from the inside out — payload first, then TCP, then IP, then
Ethernet — because that's the literal order a real OS network stack
assembles them.

Decapsulation on the receiving end is the same process backwards: strip
Ethernet, hand to IP; strip IP, hand to TCP; strip TCP, hand to the
application. Every "layer" in the diagram is really just "one more header
to strip before you get to the actual content."

## Why your own code never touches the network in this module

You'll notice `layer_builder.py`/`.js` build bytes and then... just print
them. They don't open a raw socket and blast the frame onto your NIC. This
isn't a cop-out — raw frame injection requires administrator/root privileges
and, on Windows, a packet-capture driver (Npcap) installed specifically for
that purpose, on every OS. Real security tooling (nmap, scapy, Wireshark
itself) all need elevated privileges for exactly this reason: crafting
arbitrary frames is powerful enough that the OS gates it behind a
permission you have to explicitly grant.

Meanwhile `traffic_generator.py` sends completely real traffic — a real TCP
handshake, a real HTTP request — using nothing more privileged than a
normal socket connection, because that's how every ordinary program on your
machine talks to the network. The distinction that matters isn't "did
bytes cross a wire" — it's "did you have to ask the OS for special
permission to shape those bytes yourself." Module 02 keeps you on the
unprivileged side while still giving you a byte-accurate mental model; later
modules that need raw capture (still not injection) will say so explicitly
and walk you through the privilege each tool needs.

## Self-test before moving on

- Without looking, name the 4 headers `layer_builder.py` actually builds,
  in order from outermost to innermost.
- Explain in one sentence why OSI's Session and Presentation layers don't
  appear in a Wireshark capture.
- What's the difference between what `layer_builder.py` did and what
  `traffic_generator.py` did, in terms of what each one needed permission
  for?
