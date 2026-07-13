# Design Decisions — Module 05

## Why a 3-router chain for the RIP simulation, not something bigger

Count-to-infinity is easiest to see clearly in the smallest topology that
can actually produce it. A straight chain (R1-R2-R3, no redundancy) is the
textbook minimal case: R1's only path to R3 is through R2, so when the
R2-R3 link breaks, R1's stale belief is the ONLY source of bad information
R2 can receive — nothing else muddies the trace. Exercise 2 deliberately
asks the student to add a 4th router with real redundancy, which is where
split horizon alone can stop being sufficient and poison reverse enters
the picture — but that complexity was left as an exercise rather than
built into the base file, so the core failure mode is legible first.

## Why `receive()` must accept worse updates from the current next-hop

This was not an upfront design decision -- it was a bug caught during this
module's own build (see tutorial.html's callout). The initial
implementation only accepted strictly-better metrics, which is textbook
Bellman-Ford relaxation and is correct for updates from ANY OTHER neighbor.
But a router's current route depends entirely on its current next-hop's
own belief — if that neighbor's situation gets worse, the router MUST
follow, even though "worse" superficially looks like something Bellman-Ford
relaxation should reject. Distinguishing "is this update from my current
path's authority" from "is this update from some other neighbor offering a
maybe-better alternative" is the one piece of real-world RIP implementation
detail this file couldn't skip without silently producing permanently
wrong (rather than slowly-wrong-then-correct) routing tables.

## Why INFINITY = 16, not some arbitrary cap

This is RIP's actual real-world value, defined in RFC 2453, chosen
specifically to bound how long count-to-infinity can drag on in real
deployments (16 hops is deliberately small — RIP was never meant for
large networks partly because of this exact limitation). Using the real
constant instead of an arbitrary "big number" means the simulation's
"14 rounds to converge" result is a real property of RIP's actual design
trade-off, not an artifact of this file's own choices.

## Why the OSPF simulation only does the flooding + Dijkstra core

Real OSPF has substantially more machinery: areas, designated routers on
multi-access segments, LSA sequence numbers and aging, incremental SPF
recalculation. None of that changes the core structural argument this
module is making (full-topology-visibility avoids count-to-infinity by
construction) — including it would triple the code for zero additional
insight into the one concept this module targets. A student who wants the
full protocol belongs in Module 09+ configuring real OSPF on pfSense/Cisco
equipment; this module's job is the *algorithmic* distinction, not
protocol-conformant implementation.

## Why static_routing.py and routing_protocols_sim.py are separate files instead of one

Static routing (Step 1) and dynamic routing protocols (Steps 2-3) are
different enough in what they're teaching -- "how forwarding decisions get
made" vs. "how routing tables get built in the first place" -- that
combining them would blur which mechanism produces which routing table.
Keeping them separate also means a student who only wants to review
longest-prefix-match forwarding doesn't have to load two routing protocol
simulations to get there.

## Why Node's Dijkstra uses array-sort instead of a real priority queue

At 3-4 nodes, a linear-scan "priority queue" via `Array.sort()` before
each pop is completely adequate and keeps this file dependency-free (no
npm package for a binary heap). A real implementation at internet scale
absolutely needs a proper heap — noted here rather than silently
pretending this is production-grade OSPF code.
