# Design Decisions — Module 12

## Why this module implements REAL WPA2 cryptography instead of describing it

Every other explanation of "how WPA2 key derivation works" a student is
likely to encounter is prose describing an algorithm. This module instead
runs the actual algorithm (PBKDF2-HMAC-SHA1 for PMK, the 802.11i PRF for
PTK expansion) and verifies its output against a specific, citable,
published test vector. The difference between "trust that this is how it
works" and "watch your own terminal derive the exact published value" is
the entire pedagogical point of this course, applied here to cryptography
specifically.

## Why the "IEEE"/"password" test vector was chosen for verification

This SSID/passphrase pair has been published and cited across WPA2
security literature and tooling documentation for years specifically as a
reference test vector for verifying PBKDF2-based PMK derivation
implementations. Using a widely-recognized vector (rather than an
invented one this course couldn't independently justify) lets a skeptical
reader verify this module's claim against other sources, not just this
course's own assertion.

## Why real wireless capture isn't attempted in this module

Monitor-mode packet capture requires specific wireless adapter chipset
support (many built-in laptop Wi-Fi cards cannot enter monitor mode at
all) and elevated privileges, and is fundamentally a hardware capability
this course's build/test environment doesn't have. This is the same
honest-boundary pattern as Modules 06 and 09: build and verify everything
that CAN be tested (the real cryptography, the real frame structure), and
clearly scope the hands-on hardware step as a guided exercise for the
student's own equipment.

## Why the module includes a working PTK derivation, not just PMK

Stopping at PMK derivation alone would leave "and then somehow a session
key gets made" as an unexplained black box, exactly the kind of gap this
course's philosophy tries to avoid. Implementing the actual 802.11i PRF
(HMAC-SHA1 in counter mode, expanding PMK + both MACs + both nonces into a
384-bit PTK) and verifying BOTH that two simulated endpoints converge on
an identical result AND that Python and Node produce byte-identical output
from identical fixed inputs (confirmed during this module's testing) means
every step from "passphrase" to "the actual key encrypting your traffic"
is real, working code, not description.

## Why Node's implementation needed no external dependency

Node's built-in `crypto` module already exposes `pbkdf2Sync` and
`createHmac` with SHA1 support -- both directly sufficient for this
module's needs. No npm package for "WPA2" or "802.11i" was needed or
would have added anything beyond what two built-in function calls already
provide.

## Why this module doesn't build or demonstrate an actual handshake-cracking tool

Offline dictionary/brute-force attacks against captured WPA2 handshakes
are real, well-documented security research techniques (used by tools like
hashcat and aircrack-ng) -- but building and running one, even against a
student's own network, is more appropriately scoped alongside Module 16's
authorized vulnerability-assessment framing (isolated lab context,
explicit authorization framing) than dropped into a foundational
networking module. Exercise 3's timing exercise gives a taste of WHY
iteration count matters for this kind of attack without building the
actual offensive tool here.
