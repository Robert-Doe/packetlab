# Head First: A VPN Is Just Two Boxes Agreeing to Lie to Everyone in Between

## What "tunnel" actually means, mechanically

Every network between your laptop and a remote peer — your home router,
your ISP, transit providers, the remote peer's own ISP — sees ONLY the
outer, encrypted UDP packet. None of them can see, or need to see, that
inside that UDP payload is an entire second IP packet, addressed to
`10.10.0.2`, a network that exists nowhere in the real, routable internet.
That's the whole trick of tunneling: **encapsulating an entire packet
inside another protocol's payload**, so intermediate networks only ever
handle the outer envelope while the inner one rides along completely
opaque to them. You've actually seen this pattern before — Module 02's
`layer_builder.py` showed HTTP encapsulated inside TCP inside IP inside
Ethernet. A VPN just adds one more layer: your REAL packet, encapsulated
inside an encrypted UDP payload, which then gets its OWN IP/Ethernet
wrapping for the trip across the real network.

**Brain power:** why does `wg_config_generator.py` create tunnel addresses
(`10.10.0.1`, `10.10.0.2`) that are completely unrelated to either
machine's real IP address? Because the tunnel is a genuinely separate,
private network layered on top of the real one — your applications
(ping, a browser, anything) talk to `10.10.0.2` exactly as if it were any
other reachable host, with zero awareness that WireGuard is intercepting
those packets, encrypting them, and re-emitting them as UDP traffic to the
peer's REAL address. The tunnel IP space is invented specifically so
"where do I send this" and "how does it actually get there" are
completely decoupled.

## Public-key crypto solves a problem Module 03's ARP never could

Remember Module 03's headfirst.md pointing out that ARP trusts whoever
replies first, with zero verification? WireGuard is the deliberate
opposite. Each peer's `PublicKey` in the config isn't just an address —
it's a cryptographic guarantee: only the holder of the matching
`PrivateKey` can actually establish a session as that peer. There's no
"first reply wins" here; there's "prove you hold this exact secret, or
this tunnel never comes up at all." This is why `wg_keygen.py` re-derives
the public key from the private key and checks they match — that
mathematical relationship (private key → uniquely determines one public
key, easy one direction, computationally infeasible to reverse) is the
entire foundation of every peer's identity in the tunnel.

## Why the Wireshark capture in Step 4 shows you nothing

This is the payoff of the whole module, and worth sitting with: you sent a
real ICMP ping, and a packet capture running on the SAME machine, on a
REAL interface, watching the packet leave, showed you nothing resembling
a ping at all — just opaque encrypted bytes wrapped in UDP. Compare this
to Module 02, where every single header of your plaintext HTTP request was
fully legible in the same tool. The difference isn't Wireshark being
worse at parsing WireGuard's format — WireGuard's payload is
**indistinguishable from random noise** to anyone without the shared
session key, by design. This is what "confidentiality" means as a concrete
network property, not an abstract promise: an observer with full access to
every byte crossing the wire still learns nothing about what's inside.

## Self-test before moving on

- In one sentence, what's actually encapsulated inside what, when your
  ping crosses the WireGuard tunnel? (Name all the layers, innermost to
  outermost.)
- Why can `wg_keygen.py` re-derive a public key from a private key, but
  never the reverse? What property of the math makes this asymmetric?
- If an attacker captured every single packet of your WireGuard session
  today, and also somehow captured your PUBLIC key (which is meant to be
  shareable, not secret), could they decrypt any of your traffic? Why or
  why not?
