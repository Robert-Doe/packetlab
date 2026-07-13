# Design Decisions — Module 14

## Why real Zeek conn.log format instead of an invented log schema

Using the exact field layout Zeek actually produces (`ts`, `uid`,
`id.orig_h`, etc., tab-separated, with a `#fields` header line) means
`conn_log_analyzer.py` is directly useful against real Zeek output, not
just this module's synthetic data -- confirmed by design in
`zeek_suricata_install_guide.md`'s Step 5, which explicitly asks the
student to run the real tool and feed its real output into this same
script.

## Why the beaconing detector's port-constancy fix is documented as a real bug, not hidden

During this module's own testing, the first version of
`detect_beaconing()` also alerted on the synthetic port scan, because fast
+ perfectly regular timing satisfied the low-jitter check regardless of
whether ports varied. Rather than quietly fixing this before anyone saw
it, both `tutorial.html` and `headfirst.md` walk through the fix and why
it matters -- because encountering exactly this kind of false-positive
overlap, and learning to fix it with a better distinguishing SIGNAL rather
than a tighter THRESHOLD, is itself one of the most transferable lessons
in this module. A student who never sees a detector produce a
false-positive, and never sees it get fixed properly, hasn't actually
learned how real detection engineering iterates.

## Why mini_ids_rules.py parses genuine Suricata/Snort rule syntax

Inventing a simplified rule format would be easier to implement but would
teach a syntax the student can't transfer to real tools. The regex-based
parser in `parse_rule()` handles the real
`action proto src src_port -> dst dst_port (options)` header structure and
real `key:"value";` option syntax -- a rule written for this engine needs
only cosmetic changes (this engine simplifies protocol/port matching to
always "any any" rather than actually filtering on them) to run on real
Suricata.

## Why this module doesn't attempt real Zeek/Suricata installation or execution

Both are substantial, actively-maintained open-source projects with
primarily Linux-native installation paths (Zeek in particular has limited,
awkward Windows support) -- fundamentally outside what this course's
Windows-based build/test environment can install and verify. This is the
same honest-boundary treatment as Modules 06, 09, and 12: build and
thoroughly test the algorithmic core (which IS this module's actual
teaching content), and provide a clear, correct installation path
(`zeek_suricata_install_guide.md`) for the real tools in the student's own
Module 09 virtual lab.

## Why the port-scan and beaconing generators use a seeded PRNG

Reproducibility matters more here than in some other modules' generators
because the student needs to see the SAME statistical patterns each run
while developing Exercise 1's exfiltration detector or tuning thresholds
-- a fresh random pattern every run would make it hard to tell whether a
code change actually fixed something or the student just got a different,
easier random sample. Cross-language reproducibility wasn't attempted
(Python's `random` and the JS file's hand-rolled LCG don't produce
identical sequences from the same seed) -- only within-language
reproducibility was the goal, confirmed sufficient by this module's actual
testing (both language variants independently produce detectable
port-scan and beaconing patterns, and their outputs are cross-compatible
at the FILE FORMAT level, verified by running each language's analyzer
against the other's generated log).
