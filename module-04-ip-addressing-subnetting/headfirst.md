# Head First: A Subnet Mask Is Just an AND Operation

## Every subnetting rule you've ever memorized reduces to one operation

"Network address = IP AND mask." That's it. That's the whole trick behind
subnetting, and everything else — broadcast address, usable host range,
how many hosts fit — is a small variation built on top of that single
bitwise AND.

Write an IP address and a mask in binary, stacked:

```
   IP:    11000000.10101000.00000001.01000101   (192.168.1.69)
   Mask:  11111111.11111111.11111111.11000000   (/26 = 255.255.255.192)
   AND:   11000000.10101000.00000001.01000000   (192.168.1.64 = network)
```

Wherever the mask has a `1`, the IP's bit survives. Wherever the mask has a
`0`, the result is forced to `0`. That's the network address — the "base"
of whatever subnet that IP lives in. The mask isn't a filter or a
permission list; it's a stencil that keeps some bits and zeroes out the
rest.

**Brain power:** if AND-ing with the mask gives you the network address,
what operation gives you the broadcast address? Answer: OR the network
address with the mask's *inverse* (the wildcard mask — literally what
`~mask` computes, which is exactly what `prefix_to_mask_int`'s counterpart
`wildcard_int` does in the calculator you just built). The wildcard mask
flips every bit: 1s become the "host portion," 0s become the "network
portion." OR-ing the network address with all-1s in the host portion sets
every host bit to 1 — which is, by definition, the broadcast address.

## CIDR notation is just "how many 1s does the mask start with"

`/26` doesn't mean anything mystical — it means the first 26 bits of the
32-bit mask are `1`, and the rest are `0`. `prefix_to_mask_int(26)` computes
exactly this: shift `0xFFFFFFFF` (32 ones) left by `32 - 26 = 6` positions,
which pushes 6 zero bits in from the right, leaving 26 ones followed by 6
zeros. Every CIDR prefix you'll ever see is this one line of bit-shifting.

## Why usable hosts is always "total minus 2" (except when it isn't)

A block of `2^(32-prefix)` addresses always has exactly two addresses
reserved by convention: the very first (network address — "this whole
block," not a host) and the very last (broadcast address — "everyone in
this block," not one specific host). Everything in between is assignable
to a real device. That's where "usable hosts = total - 2" comes from — not
a rule someone invented, just what's left over once you remove the two
addresses whose entire purpose is to name the block itself and address
everyone in it at once.

The two exceptions you implemented — `/31` (RFC 3021, both addresses
usable, meant for router-to-router links where "broadcast" is meaningless
anyway with only 2 possible devices) and `/32` (a single host, no group to
address at all) — exist because the "reserve 2" convention stops making
sense once the block is too small to need a broadcast concept in the first
place.

## VLSM: the same math, allocated greedily

Variable Length Subnet Masking sounds like a separate topic; it's the exact
same `subnet_info` math, called repeatedly, with one added rule: **give the
biggest request the biggest block first.** Why biggest-first? Because
smaller blocks are more flexible about where they can start (any address
divisible by their own smaller size), while bigger blocks need a bigger,
rarer starting-point alignment. Packing big blocks first and letting small
ones fill the gaps wastes the least address space — which is exactly why
`vlsm_allocate` sorts requirements largest-first before allocating anything.

## Self-test before moving on

- Compute, by hand, the network and broadcast address of
  `10.20.30.40/28` — then check yourself with `subnet_calc.py`.
- Explain in one sentence why `/31` breaks the usual "usable = total - 2"
  rule.
- In VLSM, why does allocating the largest requirement first waste less
  address space than allocating in arbitrary order?
