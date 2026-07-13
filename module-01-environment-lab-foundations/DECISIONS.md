# Design Decisions — Module 01

Notes on *why* this module's lab code is built the way it is.

## Why both a Python and a Node variant, sharing one dashboard.html

The point of this module is "your OS state, read by code" — the language
reading it is incidental to the networking concept. Building both variants
against the exact same frontend (`dashboard.html` fetches `/api/netinfo` and
renders whatever JSON comes back, regardless of which backend produced it)
makes the equivalence concrete instead of asserted: the student sees
byte-identical gateway/DNS values come out of two completely independent
implementations. This pattern repeats through the rest of the course
wherever a concept isn't language-specific — Modules 04 (subnet
calculator), 07 (sockets), and 08 (protocol servers) all get dual variants
too.

## Why ports 5000 (Python) and 5050 (Node), not the same port

Running both variants simultaneously — not sequentially — is what makes
"compare the two dashboards side by side" possible in Step 2 of the
tutorial. Different ports let both stay up at once without a restart. 5000
is Flask's traditional default; 5050 was picked as a clearly-different,
easy-to-remember second number, not for any protocol reason.

## Why psutil instead of parsing `ipconfig`/`ifconfig` for interfaces in Python

`psutil.net_if_addrs()` / `net_if_stats()` give structured, cross-platform
interface data (up/down state, MTU, speed) without the student's code
having to special-case Windows vs. Linux output formats. Gateway and DNS
lookups, by contrast, have no equivalent psutil API — so that part of the
code *does* text-parse OS command output, deliberately left visible rather
than hidden behind another dependency, so the student sees exactly where
"structured API" ends and "shell out and parse text" begins.

## Why zero npm dependencies in the Node variant

Node's built-in `os` module already gives structured interface data (better
than Python needed psutil for, in fact — `mac`, `family`, and `internal`
come for free). Since nothing else in this module needs more than an HTTP
server and some text parsing, adding Express or any npm package would only
be one more thing to `npm install` for zero teaching benefit. Later modules
(e.g., any that need WebSocket support or heavier JSON schema validation)
will introduce dependencies when they actually earn their place.

## Why the ARP/gateway/DNS regex parsing isn't wrapped in more error handling

Malformed or missing data (e.g., `default_gateway: null` on an interfaceless
sandbox) is handled by returning `None`/`null` rather than raising — the
dashboard already displays "(none found)" for empty values. Wrapping every
`_run()` call in elaborate retry/fallback logic would suggest these commands
are flaky or adversarial input, which they're not: they're the same trusted
local OS commands a human would type at a terminal. Later modules
(Module 12 onward) introduce real adversarial input handling once the
student is working with untrusted network data instead of their own OS's
own command output.

## Why `/api/netinfo` is a GET with no auth

Both servers bind to `127.0.0.1` only — see `../SAFETY.md`. Anything that
can reach `127.0.0.1:5000` is already running as you, on your machine, so
an auth layer here would protect against nothing. Auth becomes relevant
starting Module 09, once services in this course begin listening beyond
localhost inside an isolated lab VLAN.
