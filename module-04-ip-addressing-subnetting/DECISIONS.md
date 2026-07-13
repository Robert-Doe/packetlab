# Design Decisions — Module 04

## Why manual bit math instead of just using `ipaddress`/a CIDR npm package

The entire pedagogical point of this module is that subnetting is
arithmetic, not lookup-table memorization. Importing `ipaddress` and
calling `.network_address` would produce correct answers while teaching
nothing about why they're correct. `ipaddress` is used exactly once, in
`_self_test()`, purely as an oracle to verify the hand-rolled math — never
as a shortcut in the actual logic a student is meant to read and learn
from.

## Why Node's self-test shells out to Python instead of using an npm package

Node has no bundled standard-library IP address module equivalent to
Python's `ipaddress`, and installing one just to serve as a test oracle
would be an odd dependency for a module whose entire point is "you don't
need a library for this." Shelling out to `subnet_calc.py` (which itself
validates against Python's stdlib) achieves the same cross-check
transitively — if Python's file passes its own self-test, and Node's file
agrees with Python's file, Node's file is implicitly validated against the
stdlib too, one hop removed.

## Why `>>> 0` appears throughout the JS file

JavaScript's bitwise operators (`<<`, `|`, `&`, `~`) all operate on
**signed** 32-bit integers internally. `~0xFFFFFFFF` in JS does NOT give
you `0` the way you'd expect from unsigned bit-flipping — it gives you a
negative number due to two's-complement sign interpretation. `>>> 0`
(unsigned right shift by zero bits) is a common JS idiom that forces a
value back into the unsigned 32-bit range without changing any of its
bits. Every arithmetic result in this file that represents a raw IP
address (which must be treated as unsigned) uses this idiom. Python needed
no equivalent because Python integers have arbitrary precision with no
sign-bit ambiguity at 32 bits.

## Why the quiz generator restricts prefixes to /24-/29

Prefixes shorter than /24 (e.g., /16) produce network sizes so large that
"usable hosts" answers become unwieldy numbers a student can't sanity-check
by eye, undermining the drill's purpose. /30 and shorter were excluded from
the *quiz* (though fully supported by the *calculator*) because they
collide with the /31 and /32 special cases already covered explicitly by
`subnet_calc.py`'s own docstring — the quiz is meant to drill the common
case, not re-test edge cases the calculator's design decisions already
called out.

## Why VLSM allocation sorts largest-requirement-first

This is the standard VLSM packing heuristic taught in every networking
curriculum, and for good reason: smaller blocks have looser alignment
requirements (they can start at more possible addresses) than larger
blocks. Placing large, alignment-picky blocks first and letting smaller,
flexible blocks fill in afterward minimizes wasted address space. Allocating
in arbitrary or smallest-first order can strand you with insufficient
contiguous space for a later large requirement even when the total address
count would technically have been enough — a classic VLSM exam trap this
implementation avoids by construction.

## Why VLSM currently gives every N-host requirement a full block including /30 for 2-host links

The allocator's "needed_addresses = hosts_needed + 2" rule always reserves
network + broadcast addresses, even for a 2-host point-to-point link that
could technically fit in a /31 (RFC 3021, 0 wasted addresses, already
implemented in `subnet_info`). This was left as Exercise 2 rather than
built in, so the student has to notice the inefficiency themselves by
reading VLSM output and connect it back to the /31 special case they
already saw in Step 1's calculator work — noticing this kind of
optimization opportunity yourself is the actual skill being taught, not
just having correct code.
