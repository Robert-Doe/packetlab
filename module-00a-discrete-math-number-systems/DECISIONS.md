# Design Decisions — Module 00a

## Why this module exists at all, inserted before Module 01

The original 19-module course assumed comfort with binary/hex arithmetic,
bitwise logic, and modular arithmetic without ever teaching them --
Module 04's subnet masking and Module 12/13's cryptography both lean on
this material heavily. Rather than have those modules stop to re-derive
prerequisites mid-lesson, this module front-loads them, tested and
verified, so later modules can build on them without re-teaching.

## Why a real, working Diffie-Hellman demo was added here, filling a gap the original 19 modules never covered

The original course's Tier 3 bullet list mentioned "key exchange
(DH/ECDH)" but no module actually built one -- Module 13 covers X.509/TLS
at the certificate layer without showing the raw key-exchange math
underneath. Toy-scale DH (small prime, small generator) is genuinely
simple enough to implement and verify by hand, and directly sets up
Module 13's TLS handshake conceptually (real TLS 1.3 uses (EC)DHE key
exchange combined with certificate-based authentication) -- this module
closes that gap rather than leaving it as an unfulfilled bullet point.

## Why the JS self-test bug (Math.pow precision loss) was fixed rather than avoided by picking smaller test ranges

Choosing smaller random exponent ranges would have avoided the bug
without the student ever encountering it -- but hitting a genuine
floating-point precision failure, understanding WHY it happened (IEEE 754
double-precision floats have ~15-17 significant decimal digits, and
`1000^40` is a 120-digit number), and fixing it with BigInt is more
valuable than a clean demo that never surfaces this extremely common
real-world numerical computing pitfall. `tutorial.html` and
`tutorial2.html` both call this out explicitly rather than silently
shipping the fixed version with no explanation.

## Why tutorial2.html goes well beyond what number_systems.py/modular_arithmetic.py actually compute

The code demonstrates MECHANISM (how to convert bases, how modular
exponentiation works, that DH produces a matching secret). It does not
and cannot teach the THEORY that explains why these mechanisms are
correct, secure, or relevant (Fermat's Little Theorem, the discrete
logarithm problem's conjectural hardness, two's complement's hardware
rationale). Per the user's explicit request for comprehensive-exam-level
depth, tutorial2.html covers this theoretical layer directly, tutorial3.html
tests it with exam-style Q&A, and both are new additions beyond this
module's original code-and-run-it pattern.

## Why tutorial3.html uses `<details>/<summary>` instead of a plain Q&A list

Presenting the question and immediately visible answer defeats the actual
practice value of self-testing -- a comprehensive exam requires producing
an answer under question pressure, not recognizing a correct answer when
it's already on the page. The collapsible format forces a genuine
retrieval-practice attempt (commit to an answer, then check) rather than
passive reading, which cognitive science research on testing effects
consistently shows produces better retention than re-reading alone.
