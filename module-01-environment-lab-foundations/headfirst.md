# Head First: Your Machine Already Knows More Than You Think

## Before you can understand a network, understand your own node on it

Every networking book starts with the OSI model, seven layers, a diagram.
That's Module 02. This module starts somewhere more useful: **your own
computer, right now, already has a complete picture of its own network
identity sitting in memory** — interfaces, addresses, a default gateway, DNS
servers, a cache of recently-seen neighbors. You don't need to send a single
packet to see most of it. You just need to know where your OS keeps it and
how to ask.

That's the whole point of Module 01. Not "here's networking theory" — here's
**your actual home network, right now, read back to you by code you can
open and modify.**

## Two languages, one truth

You just ran the same introspection in Python and in Node.js and got the
same gateway, the same DNS servers, back from both. That's not a
coincidence and it's not because the two languages agree on anything — it's
because **there's only one operating system underneath both of them**, and
both languages are just asking it the same question through different
doors.

This is a pattern you'll see constantly in networking: the protocol/data
doesn't care what language reads it. TCP doesn't know Python exists. Your
router doesn't know if the machine pinging it runs Node or Rust or C. The
network layer is language-agnostic by construction — which is exactly why
this course builds a Python variant and a JS variant side by side wherever
it can. If a concept only "works" in one language, you haven't understood
the concept yet — you've understood a library.

**Brain power:** why did Node's `os.networkInterfaces()` give you structured
data with zero parsing, while getting the *default gateway* in both Python
and Node required scraping text out of `ipconfig`? Two different OS
subsystems are involved: interface configuration is exposed through a
well-defined, stable kernel API that every language's standard library
wraps directly. Routing tables and DNS resolver config are *also* real OS
state — but neither language ships a wrapper for reading them portably,
so both fall back to the same lowest-common-denominator interface every
human uses too: the shell command. You just watched two "high-level"
languages hit the exact same floor.

## Same-origin's cousin: "your own machine's trust boundary"

You haven't hit Same-Origin Policy yet in this course (that's a browser-JS
concept, not core networking) but there's a parallel idea worth planting
now: your machine trusts its own ARP cache, its own routing table, its own
DNS resolver config, completely — no verification happens by default when
your OS caches "this MAC address answered for this IP" or "this DNS server
told me this hostname maps to that address." Every module from 03 onward
is partly about what happens when that trust gets abused (ARP spoofing,
DNS cache poisoning). Right now, in Module 01, just notice: your ARP table
is a cache of *claims*, not a cryptographically verified ledger. Hold onto
that; Module 03 cashes it in.

## Why this module has no vulnerability, no attack, nothing to break

Every module after this one gets progressively more hands-on with actively
probing, capturing, and eventually stress-testing your own network. Module
01 is deliberately just *reading*. You cannot break anything by running
`netinfo_server.py` or `netinfo.js` — they issue zero outbound packets
beyond what your OS's own `ipconfig`/`arp` commands already do locally.
This is the safest possible starting point: build comfort with your own
machine's state before Module 02 asks you to capture other machines'
traffic crossing your NIC.

## Self-test before moving on

- Can you name, from memory, the four things this module's dashboards show
  you (interfaces, default gateway, DNS servers, ARP table) and which OS
  subsystem each one comes from?
- Can you explain why the ARP table entry for a device you just pinged
  didn't exist until you pinged it? (If not — re-read Step 4 of the
  tutorial and think about what "cache" implies: something has to populate
  it before it's there.)
- If you swapped ISPs tomorrow, which of the four values would change
  immediately (DNS servers, likely — ISP-assigned) versus which would stay
  the same regardless of ISP (your interface's MAC address — hardware-based,
  not network-assigned)?
