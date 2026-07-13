# Design Decisions — Module 08

## Why DNS binds to port 5053, not the real port 53

Binding to port 53 requires root/administrator privileges on every major
OS (it's a "privileged port," below 1024). Beyond the permissions hurdle,
running anything on port 53 risks conflicting with a real resolver already
listening there (systemd-resolved on Linux, Windows' own DNS client
service). Port 5053 avoids both problems entirely while changing nothing
about the DNS message format itself -- the port a DNS server listens on
has no bearing on the protocol running over it.

## Why nslookup isn't used as the verified test client

During this module's own build, `nslookup -port=5053 lab.test. 127.0.0.1`
on Windows silently queried the real system resolver instead of the
course's own server (confirmed by checking the server's own log, which
showed no incoming query at all). Rather than include an unverified
command in the tutorial, `dns_client.py`/`.js` -- which WAS tested and
confirmed working -- is the primary verification path, with `dig`'s `-p`
flag (Linux/Mac, well-documented and reliable) offered as an optional
extra for students who have it.

## Why DHCP is a pure simulation with no real socket at all

This is the one protocol in this module where "just run a real server" is
actively dangerous rather than merely inconvenient. Real DHCP servers
listen for broadcast traffic on UDP 67/68 across an entire physical
segment -- on a home network, that's every device sharing the router,
including devices belonging to other people in the house. A buggy or
misconfigured simulated DHCP server that raced the real router's DHCP
server and won could hand a real device a bogus lease, knocking it off the
network. No amount of "just bind to 127.0.0.1" fixes this, because DHCP's
entire mechanism depends on broadcast reaching real devices -- there's no
safe, localhost-only way to demonstrate the real protocol's network
behavior. Simulating the state machine in software (offer/lease maps,
DORA sequencing, pool exhaustion) preserves everything actually worth
learning about DHCP's logic without the risk.

## Why http_server_from_scratch.py only calls recv() once per connection

A real production HTTP server must loop on `recv()` until it's seen the
full `\r\n\r\n` header terminator, because TCP makes no promise that an
entire HTTP request arrives in a single read -- large requests, slow
clients, or an unlucky segment boundary could split it across multiple
`recv()` calls. This demo's single-read simplification works for curl's
small test requests (confirmed during testing) but would break on a
request split across TCP segments -- which Exercise 2 asks the student to
discover for themselves rather than papering over with a "real" server
that hides the same lesson Module 07 already taught about TCP being a
byte stream, not a message-delimited protocol.

## Why the HTTP demo uses raw net/socket instead of Node's `http` module or Python's `http.server`

Both of those modules are still frameworks, just lower-level ones than
Flask -- they still parse the request line and format the response for
you. Building directly on `net`/`socket` is the only way to make every
single parsing decision (where does a header end, how is Content-Length
computed) visible in code the student wrote, matching this module's
explicit goal of showing what Flask (and even Node's own `http` module)
normally hides.

## Why Node's DNS client imports encode/decode helpers from dns_server.js

Duplicating `encodeQname`/`decodeQname` in both files would risk them
silently drifting apart if one was edited without the other -- these
functions implement one specific wire-format rule (length-prefixed
labels), and there's exactly one correct way to do it. Importing from the
server file keeps that single source of truth, at the minor cost of the
server module needing a `require.main === module` guard (see the fix
applied during this module's own testing) so requiring it for its helpers
doesn't also bind a UDP socket.
