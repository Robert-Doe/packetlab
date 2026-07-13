# Head First: A Router Only Ever Trusts One Question

## "Which of my routes is the MOST SPECIFIC match?" That's the whole job.

Every routing decision a router ever makes — static, RIP, OSPF, BGP, your
home gateway, a Fortune-500 core router — boils down to one repeated
question: *of everything in my table that matches this destination, which
entry is the most specific?* That's longest-prefix match, and it's the only
algorithm `static_routing.py` needed to fully simulate real forwarding
behavior. A `/32` route beats a `/24` route beats a `/0` default route,
every time, regardless of which one was configured first or which one
"seems more important." Specificity wins, full stop.

**Brain power:** in Step 1's trace, a packet to `8.8.8.8` at R1 matched only
one route — `0.0.0.0/0` — because nothing more specific existed for that
destination. If you added a route for `8.0.0.0/8` to R1 tomorrow, which
route would win for a packet to `8.8.8.8`? The `/8` route — 8 bits of
specificity beats 0 bits of specificity, even though the `/0` default route
covers literally everything including `8.0.0.0/8`. "Covers everything" and
"most specific" are different properties, and only the second one matters
for route selection.

## RIP doesn't share a map. It shares a rumor.

This is the single idea this module most wants you to walk away with.
When R1 tells R2 "I can reach R3 in 2 hops," R2 has **no way to verify
that claim, no visibility into R1's reasoning, and no idea what R1's route
to R3 actually passes through.** R2 just trusts the number. This is
"distance vector" — you exchange *distances*, not *topology*. It's compact,
cheap to compute, and was genuinely revolutionary in 1988 when RIP shipped
— but it has a structural weakness baked into its design: **a router can
receive bad news about a route it originally gave to someone else,
without any way to recognize the rumor is circular.**

That's exactly what you watched happen in Part 1. After the R2-R3 link
broke, R2 correctly knew R3 was unreachable — for one instant. Then R1,
still holding its stale "R3 is 2 hops away, via R2" belief, told R2 exactly
that. R2, with no way to know this "new" information originated from R2's
own now-broken route in the first place, believed it: "oh, R1 says 2 hops,
plus 1 to reach R1, so R3 is 3 hops from me now." R2 then reported this
*wrong* improvement back to R1, who incremented it again, and so on — both
routers slowly inflating a lie neither one could independently detect,
because neither one could see past "what number did my neighbor tell me."

## Split horizon: "don't tell someone what you learned from them"

The fix is almost embarrassingly simple once you see the disease clearly:
**never advertise a route back to the exact neighbor you learned it from.**
R1 learned "R3 is reachable" from R2 — so R1 should never turn around and
tell R2 "R3 is reachable" as if it were new information. That's the entire
mechanism `advertisement_for(neighbor, split_horizon=True)` implements: one
`if` statement, skipping any route whose `next_hop` equals the neighbor
you're about to talk to. You watched this collapse a 14-round oscillating
failure into a single-round correct answer.

(Split horizon alone isn't a complete fix in every topology — Exercise 2
asks you to find a redundant-path scenario where you need "poison reverse"
too: instead of silently omitting the route, explicitly advertise it back
as infinity. Both techniques attack the same root cause: never let a
router's own information boomerang back to it disguised as independent
confirmation.)

## OSPF doesn't have this problem because it never plays telephone

Link-state routing sidesteps the entire disease by refusing to summarize
anything. Every router floods its *raw, unprocessed, direct connectivity* —
"I am R2, and I connect to R1 with cost 1 and R3 with cost 1" — to every
other router, unmodified, exactly as it is. Nobody ever receives a
neighbor's *conclusion*; everybody receives everyone's *raw facts* and
draws their own conclusion (via Dijkstra) independently. There's no rumor
to distort because nothing is ever passed through a second party's
interpretation. This is why Part 2's failure recovery had no oscillation
phase at all — the moment the LSA reporting "R2-R3 link is gone" arrives,
every router's Dijkstra run simply doesn't have that edge anymore. There's
no stale belief to hold, because nothing was ever inferred — only reported.

## Self-test before moving on

- In one sentence, what's the actual difference between "distance vector"
  and "link state" — not "RIP vs OSPF" as brand names, but the structural
  difference in what information gets shared?
- Why does split horizon fix the specific 2-router ping-pong you saw, but
  Exercise 2 asks whether it's enough once a 3rd, redundant path exists?
- Why can't Dijkstra's link-state approach ever produce a "count to
  infinity" pattern, structurally — not "because OSPF is smarter," but
  because of what information it does and doesn't propagate?
