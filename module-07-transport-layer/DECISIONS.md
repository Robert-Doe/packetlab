# Design Decisions — Module 07

## Why tcp_state_machine.py simulates states instead of reading them from a real socket

No portable, privilege-free API in Python or Node exposes "what TCP state
is this specific socket object in right now" directly from user-space --
that information lives in the OS kernel's TCP control block, and the
standard way to observe it externally is exactly what Step 3 of the
tutorial has the student do: run `netstat`/`ss` as a separate OS-level
tool, from outside the process. `tcp_state_machine.py` exists so the
student has a clean, deterministic reference model to compare that real
observation against, rather than trying (and failing, or needing root/admin
plus platform-specific APIs) to introspect socket internals directly from
the application itself.

## Why the "simultaneous close" bonus scenario is included at all

Every TCP tutorial covers the standard 4-step active-close sequence. Far
fewer cover the CLOSING state, because it only appears in the rarer case
where both sides close at almost the same instant -- rare enough that
Exercise 3 (reproducing it for real in Wireshark) explicitly warns it's
hard to trigger reliably. It's included specifically because a state that
exists ONLY to handle one exact timing coincidence is a good forcing
function for understanding that TCP's state machine isn't an arbitrary
list -- every state and transition exists to handle some real, specific
scenario, including rare ones.

## Why the UDP demo drops REPLIES, not incoming datagrams

Dropping the client's outbound datagrams before the server even sees them
would be equally valid, but dropping replies keeps the demonstration
entirely inside code this course controls (the server's own send call),
rather than requiring an artificial firewall rule or OS-level packet drop
to simulate loss on the way in. It also keeps the server's own
"received #N" log complete and useful as an independent cross-check
against the client's observed gaps -- which is exactly what this module's
own testing did to confirm both sides agree on which datagrams were lost.

## Why the drop pattern is seeded/reproducible rather than fully random

A student debugging "why did my modified retry logic in Exercise 1 not
seem to help" benefits from a reproducible loss pattern across runs while
developing -- true unseeded randomness would make it hard to tell whether
a fix actually worked or the student just got lucky on that particular
run. Real-world loss is not reproducible this way, which is itself worth
noting: this demo intentionally trades realism for debuggability.

## Why Node's UDP server needed a hand-rolled seeded PRNG

`Math.random()` cannot be seeded in standard JavaScript -- there's no
built-in equivalent to Python's `random.seed()`. A minimal linear
congruential generator was written specifically to give the Node variant
the same "reproducible for this demo" property as the Python version,
without adding an npm dependency for something this small.

## Why the Node TCP/UDP variants use different ports than the Python ones

Running the Python and Node variants of both protocols on distinct ports
(9007/9009 for Python, 9017/9019 for Node) lets a student run all four
side by side without port conflicts, matching Module 01's pattern of
letting both language variants stay up simultaneously for direct
comparison.
