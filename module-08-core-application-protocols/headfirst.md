# Head First: Every "Magic" Protocol Is Just Bytes With Rules

## DNS is not a black box. It's 12 header bytes and a labeled name.

You've typed `nslookup` or watched a browser resolve a hostname a thousand
times without ever seeing what actually crosses the wire. `dns_server.py`
just showed you: a DNS message is a 12-byte header (ID, flags, and four
counts) followed by a question section that encodes a hostname as a
sequence of **length-prefixed labels** — not a string with dots, but a
byte counting how many characters come next, repeated until a zero byte
ends it. `lab.test.` becomes `\x03lab\x04test\x00` — 3 bytes of "lab", 4
bytes of "test", then a zero terminator. That's genuinely the entire
encoding. Every DNS resolver on Earth, from your phone to Google's public
DNS, reads hostnames this exact way.

**Brain power:** the answer section in `dns_server.py`'s response doesn't
repeat the hostname — it sends the two bytes `0xC00C` instead. Why does
that work? Because `0xC0` has its top two bits set, which is DNS's signal
for "this isn't a length byte, it's a compression pointer" — and `0x0C`
(12 in decimal) says "go read the name starting at byte offset 12 of this
message," which is exactly where the question section's hostname begins.
Real DNS responses use this constantly to avoid repeating long names
across dozens of answer records; you just implemented the simplest
possible case of it.

## DHCP's DORA exists because broadcast has no "excuse me, is this taken?"

A brand-new device on a network doesn't have an IP address yet — which
means it can't be addressed directly by anything, including a DHCP server.
That's why DHCP starts with a **broadcast**: DHCPDISCOVER goes to
everyone on the segment, because "everyone" is the only address a
freshly-booted device can reach. But broadcast means multiple DHCP
servers (if more than one exists) could all reply with DHCPOFFER — so the
client has to explicitly say, via DHCPREQUEST, *which* offer it's
accepting, broadcasting that choice too so every OTHER server that
offered can withdraw its tentative reservation. DORA isn't 4 arbitrary
steps — it's the minimum negotiation needed when neither side can address
the other directly until the negotiation finishes.

**Brain power:** why does `dhcp_dora_sim.py`'s server track two separate
maps — `offered` and `leases` — instead of just one? Because an OFFER is
not a commitment. A client can receive an offer and never follow up with a
REQUEST (maybe it got a better offer from a different server on a network
with multiple DHCP servers). If the server marked the address as leased
the instant it was offered, and the client walked away, that address would
be stranded — unusable by anyone — forever. Keeping `offered` separate
from `leases` is what lets the address safely go back into the pool if a
DISCOVER/OFFER never turns into a REQUEST/ACK.

## HTTP's entire "magic" is a text protocol you could type by hand

`http_server_from_scratch.py` parses a request by finding
`\r\n\r\n` (the blank line separating headers from body) and splitting on
`\r\n` and `:`. That's it. HTTP/1.1 is fundamentally a *text* protocol —
you could open a raw TCP connection with `telnet` or `nc` and type a valid
HTTP request by hand, character by character, and a real server would
answer you. This is by design: HTTP was built in an era (1991) that valued
human-readability and debuggability over compactness, and that design
choice is exactly why `curl -i` against your hand-rolled server produces
output a human can read directly, headers and all, with no special tooling.

## Self-test before moving on

- Without looking, describe how DNS encodes a hostname like `www.lab.test.`
  in the actual bytes sent over the wire.
- Explain why DHCP's first message has to be a broadcast rather than sent
  directly to a specific server.
- What's the one line of separator (`\r\n\r\n`) that
  `http_server_from_scratch.py` depends on to know where headers end and a
  body begins — and what would happen if a client sent a request using
  bare `\n` instead of `\r\n`? (Try it — Exercise 2 asks you to break this
  exact assumption on purpose.)
