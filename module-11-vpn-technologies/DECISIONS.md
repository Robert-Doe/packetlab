# Design Decisions — Module 11

## Why WireGuard, not OpenVPN or IPsec

WireGuard's entire protocol is small enough to read end to end (its
reference implementation is a few thousand lines, versus OpenVPN's much
larger and more configurable codebase), its config file format is compact
enough to generate and read as a teaching artifact in one screen, and its
key format (raw X25519, base64-encoded) maps directly onto a primitive
(`X25519PrivateKey`) both Python's `cryptography` library and Node's
built-in `crypto` module support natively -- no npm/pip package written
specifically for WireGuard was needed to generate genuinely valid keys.
OpenVPN's certificate-based model and IPsec's considerably more complex
negotiation (IKE phases) would both require substantially more machinery
to demonstrate authentically.

## Why this module generates REAL keys instead of placeholder-looking strings

A student who has only ever seen a WireGuard config with obviously fake
keys (e.g. `PrivateKey = <your private key here>`) never actually
confronts what a real key looks like, how long it is, or that it's
genuinely derived via elliptic-curve math they could verify themselves.
Generating real, working X25519 keys -- and then independently
re-deriving the public key from the private key as a verification step --
turns "trust me, this is how public-key crypto works" into something the
student's own terminal just proved.

## Why Node's derivePublicKey() needs a placeholder x value in the JWK

Node's `crypto.createPrivateKey()` requires a syntactically complete OKP
JWK object (both `d` and `x` fields) to import an X25519 private key, even
though X25519 private keys are properly self-sufficient (the public key is
always derivable from the private scalar alone, per the algorithm). Node
does not appear to validate that `x` matches `d` on import for this key
type -- confirmed during this module's testing, where a fake/mismatched
placeholder `x` was supplied and `crypto.createPublicKey(privateKeyObj)`
still correctly recomputed the REAL public key from the private scalar,
ignoring the placeholder entirely. This is a genuine Node API quirk, not a
design choice this course would have preferred -- documented here so a
future maintainer isn't confused by the seemingly redundant placeholder
generation step.

## Why this module can't run/test the actual tunnel bring-up

Establishing a real WireGuard tunnel requires the WireGuard kernel module
or userspace daemon installed with elevated privileges on TWO separate
machines (or VMs) that can reach each other -- fundamentally outside what
a single sandboxed build/test environment can verify. What CAN be
verified, and was: that the generated keys are real, valid X25519 keys;
that public keys correctly cross-reference (each side's listed peer
PublicKey matches the actual derived public key of the other side's real
PrivateKey, confirmed by independent recomputation during this module's
build); and that the config file syntax is exactly what `wg-quick` expects.
The tutorial's Step 3/4 (actual tunnel bring-up, Wireshark capture)
are guided exercises for the student to perform on their own real
equipment, the same honest-boundary treatment as Modules 06 and 09.

## Why AllowedIPs defaults to /32 (point-to-point) rather than whole subnets

A narrow, single-host AllowedIPs is the safer, more obviously-correct
default for a first tunnel -- it can't accidentally route more traffic
than intended, and its behavior (only packets addressed to that exact
tunnel IP use this tunnel) is simple to reason about and verify with a
single ping test. Site-to-site routing (whole subnets through the tunnel)
is real and valuable but adds a failure mode (accidentally routing traffic
you didn't mean to) that's better introduced deliberately, as Exercise 1
does, once the simpler case is understood and working.
