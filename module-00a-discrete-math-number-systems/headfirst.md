# Head First: Every Number Is Just "How Many Groups Of..."

## Decimal isn't special. It's just the base you learned first.

You count in tens because humans have ten fingers — that's the entire
reason "decimal" (base 10) feels natural and everything else feels
foreign. But the actual IDEA behind any positional number system is
identical regardless of base: each digit position is worth (base) times
more than the position to its right. In decimal, the digit "3" in "300"
means 3 × 100 because each position leftward is worth 10× more. In binary,
each position leftward is worth 2× more. In hex, 16× more. Nothing else
changes. `number_systems.py`'s `binary_to_decimal()` function is doing
exactly this: `total += bit * (2 ** position)` — literally "how many of
this position's group value does this digit represent," summed up.

**Brain power:** why does networking use hex constantly (MAC addresses,
IPv6 addresses, memory/packet dumps) but almost never decimal for these
values, when both are "just" ways of writing the same number? Because hex
has a property decimal completely lacks: **one hex digit represents
exactly 4 bits, no remainder, ever** (since 16 = 2⁴). A byte (8 bits) is
always exactly 2 hex digits. Decimal has no such clean relationship to
binary — converting a byte to decimal requires actual arithmetic, while
converting to hex is pure grouping (split into groups of 4, look up each
group). This is why `binary_to_hex_by_grouping()` never does any
multiplication — it just chunks the binary string into 4-bit pieces and
translates each piece independently.

## AND is a stencil. OR is a merge. XOR is "count the differences."

Module 04's headfirst.md already told you subnet masking is an AND
operation. Here's the piece that file assumed you already knew: AND keeps
a bit only if BOTH inputs have a 1 there; it's a filter that can only ever
remove information, never add it — which is exactly the "stencil" behavior
a subnet mask needs (zero out the host bits, keep the network bits
untouched). OR is the opposite: a bit survives if EITHER input has a 1 —
useful for building up a value from pieces (this is how the broadcast
address gets computed: network address OR wildcard mask). XOR is neither
filter nor merge — it's a **difference detector**: a bit is 1 exactly when
the two inputs disagree, 0 when they agree. This single property is why
XOR shows up in checksums (a good checksum should look "random" —
maximally different — when even one bit of input changes) and in the
one-time pad cipher (encrypting is XOR-ing with a key; decrypting is
XOR-ing with the SAME key again, because XOR-ing twice with the same value
always cancels back to the original — `a XOR b XOR b = a`, always, for any
a and b).

## Modular arithmetic is what happens when a number system runs out of room

Every "wraps around" behavior you'll see in networking — TCP sequence
numbers rolling over past 2³², a router's TTL field capped at 255, even a
clock going from 11:59 to 12:00 — is modular arithmetic, whether anyone
calls it that or not. `mod_exp()`'s entire reason for existing is that
cryptography needs to do arithmetic where "wrapping around" isn't a bug to
avoid, it's the WHOLE POINT: working modulo a large prime keeps every
intermediate number bounded to a fixed size, no matter how many
multiplications you chain together, which is exactly what makes RSA and
Diffie-Hellman computationally practical rather than requiring numbers
with millions of digits.

## Diffie-Hellman: proving two strangers can agree on a secret in public

Read `diffie_hellman_demo()`'s output slowly. Everything Alice and Bob
SEND to each other (`p`, `g`, `alice_public`, `bob_public`) is completely
visible to an eavesdropper. Neither private number is ever transmitted.
And yet both sides end up holding an identical secret number the
eavesdropper cannot feasibly compute, having seen literally everything
that crossed the wire. This isn't a magic trick — it works because
`mod_exp(mod_exp(g, a, p), b, p)` and `mod_exp(mod_exp(g, b, p), a, p)`
are mathematically guaranteed to produce the same result (exponents
combine: `(g^a)^b = (g^b)^a = g^(ab)`, all mod p) — but computing `a` or
`b` FROM the publicly visible `g^a mod p` is (for large enough numbers)
computationally infeasible. Easy forward, hard in reverse, without the
secret. You'll see this exact asymmetry again in Module 13's RSA-adjacent
signature verification.

## Self-test before moving on

- Convert `11000000.10101000.00000001.00000001` (a full IPv4 address in
  binary) to dotted-decimal, by hand, using the place-value method.
- Explain why `a XOR b XOR b` always equals `a`, for any values of a and
  b — and why this property makes XOR useful for a simple cipher.
- Without running the code, predict: if Alice and Bob's private numbers
  were swapped, would the Diffie-Hellman demo still produce a matching
  shared secret? Why or why not?
