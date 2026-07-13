# Design Decisions — Module 18

## Why this module writes a REAL pcap file instead of a course-specific log format

Modules 03, 05, 10, and 14 all use plain text or JSON for their simulated
data, which is appropriate when the point is the algorithm, not the file
format. This module's entire point IS the file format -- reconstructing
an incident from a capture is specifically valuable because pcap is the
universal interchange format every packet tool (Wireshark, tcpdump, Zeek,
Suricata) reads and writes. A course-invented JSON schema would teach
nothing transferable; a genuinely valid libpcap file, confirmed by the
independent `file` utility during this module's build, means everything
learned here applies directly to real captures from real tools.

## Why the timestamp rounding discrepancy between Python and JS was fixed rather than left as-is

The first version of `pcap_writer.py` used `int()` (truncation) for
microsecond calculation while `pcap_writer.js` used `Math.round()`,
producing 1-microsecond differences in the generated files -- confirmed
via `diff` during this module's testing. Rather than dismiss this as
negligible and move on, the Python file was changed to match JS's
rounding, producing byte-identical output confirmed by a subsequent
`diff`. A 1-microsecond discrepancy is genuinely harmless for this
module's teaching purposes, but demonstrating that cross-language parity
CAN be achieved exactly, and showing the one-line fix that achieves it, is
more valuable than leaving an unexplained "close enough" gap for a
careful student to notice and wonder about.

## Why the synthetic incident includes a REAL historical CVE trigger string

Using the actual `USER smiley:)` trigger pattern associated with
CVE-2011-2523 (the same CVE in Module 16's vulnerability database) rather
than an invented "malicious-looking" string ties this module's forensic
narrative directly to real, documented attacker behavior a student can
independently verify by looking up the CVE, and creates deliberate
continuity with Module 16's own vulnerability matching -- the exact same
real-world incident could plausibly be caught two ways: proactively
(Module 16's banner-based vulnerability scan, before exploitation) or
retrospectively (this module's payload-pattern-based forensic
reconstruction, after the fact).

## Why detect_recon/detect_exfiltration duplicate Module 14's detection logic instead of importing it

Consistent with every other module in this course, each module's directory
is self-contained with no cross-module import dependencies, so a student
examining or running this module in isolation never hits a missing
dependency on a sibling directory. The duplication here is deliberate and
pedagogically useful rather than merely unavoidable: seeing the same
statistical technique implemented a second time, applied to a completely
different data shape (parsed pcap records instead of Zeek conn.log
records), reinforces that the underlying reasoning is format-independent
-- the mechanism doesn't care whether it's reading a live log stream or a
saved capture file.

## Why the exfiltration destination check excludes traffic TO the victim IP

`detect_exfiltration()`'s general logic would also flag the reconnaissance
phase itself (many packets arriving at the victim) if not for the explicit
`f["dst"] not in {"10.0.0.50"}` exclusion in `build_timeline()`. This
mirrors Module 14's own experience discovering that a single detection
signal (many packets, or low timing jitter) can produce a false positive
in a scenario the detector wasn't specifically designed for -- and, as
in Module 14, the fix is a more specific discriminating rule (direction
of travel: exfiltration is data leaving a compromised host, not arriving
at it) rather than a blunt threshold adjustment.
