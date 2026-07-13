# Head First: Detection Is Statistics Wearing a Security Costume

## Nobody labels the attack for you. That's the entire job.

`conn_log_analyzer.py` never sees a field that says `is_attack: true`. It
sees exactly what a real analyst, or Zeek's own scripting layer, sees: a
list of connection records with timestamps, addresses, ports, and byte
counts — and has to decide, from statistical shape alone, which
connections deserve a human's attention. This is the actual job of every
NSM tool: not recognizing "bad" content (that's Suricata's signature
matching, a different technique entirely) but recognizing "bad" BEHAVIOR
PATTERNS, which requires looking across many records at once instead of
judging any single one.

**Brain power:** why does a port scan look statistically different from a
normal user browsing 15 different websites in an hour? Both involve one
source touching many destinations. The distinguishing signal isn't COUNT
— it's DENSITY IN TIME and DESTINATION SPREAD: 40 distinct ports on the
SAME destination IP, within 2 seconds, is something no human clicking
links produces; humans are slow and spread their requests across many
different destination IPs, rarely hammering different ports on one single
host. `detect_port_scans()`'s window-based counting is specifically
designed to catch "many ports, one target, short time" while a normal
day's browsing pattern (many destinations, normal human-paced timing)
never trips it.

## Beaconing detection is looking for the ABSENCE of human randomness

Humans are bad at being regular on purpose, and this is exactly what
`detect_beaconing()` exploits. A person checking a website doesn't do it
every exactly-60.0-seconds; they check when they think to, which produces
naturally irregular (high-jitter) timing. Malware running on a timer,
calling home every N seconds with a hardcoded sleep interval, produces
suspiciously LOW jitter — the connections happen almost exactly on
schedule, every time. `jitter_ratio` (standard deviation of intervals
divided by their mean) is a single number capturing exactly this: near
zero means "suspiciously robotic," higher means "normal human
irregularity." This is genuinely one of the primary techniques real threat
hunters use to spot C2 traffic in massive amounts of otherwise-unremarkable
connection logs.

## Why the port-constancy refinement mattered more than it looks

When the first version of this module's beaconing detector also flagged
the port scan, the temptation is to think "the jitter threshold must be
wrong — tighten it." But tightening a threshold to exclude one specific
false positive usually just moves the boundary and creates new blind
spots elsewhere. The actual fix was adding a DIFFERENT signal (destination
port constancy) that captures a REAL distinguishing fact about the two
behaviors (beacons repeatedly hit one service; scans deliberately vary
ports) rather than tuning a knob until today's test case passes. This
distinction — fixing detection logic with a better feature versus fixing
it with a better threshold — is close to the core skill separating
effective detection engineering from an endless, brittle threshold-tuning
treadmill.

## A signature engine and a behavioral engine are solving different problems

`mini_ids_rules.py` and `conn_log_analyzer.py` look completely different
and answer completely different questions. Signature matching
(`mini_ids_rules.py`) asks "does this SPECIFIC packet contain a known-bad
pattern" — fast, precise, but blind to anything it wasn't explicitly told
to look for (a brand-new SQL injection syntax with different exact text
sails right past a content-match rule). Behavioral detection
(`conn_log_analyzer.py`) asks "does this TRAFFIC PATTERN look statistically
abnormal" — catches novel attacks whose specific bytes were never seen
before, but is inherently fuzzier and more prone to the kind of overlap
you just fixed. Real security monitoring runs both, deliberately, because
they catch different things and fail in different ways.

## Self-test before moving on

- Explain, in your own words, why "many connections to many different
  destinations" (normal browsing) and "many connections to few
  destinations" (scanning) require different detection logic, even though
  both involve "many connections."
- Why is a LOW jitter ratio suspicious, rather than a high one? What would
  a jitter ratio of exactly 0 mean about the timing of those connections?
- What's one real attack a signature-based engine (`mini_ids_rules.py`)
  would completely miss, that a behavioral engine
  (`conn_log_analyzer.py`) might catch instead — and vice versa?
