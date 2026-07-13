# Head First: A CTF Flag and a Research Finding Are the Same Shape

## Both are a CLAIM you must PROVE, not just assert

`solve_crackme.py` doesn't stop at "I brute-forced a string that looks
like a flag" — it runs the actual challenge binary against that string
and checks the exit code. `research_notes_checker.py` doesn't accept a
results section that just says "beaconing was detected" — it requires
`evidence`, something a skeptical reader could actually check. These are
the SAME discipline, applied to two different genres: a CTF flag is only
real once the challenge itself confirms it; a research finding is only
real once it's backed by something someone else could independently
verify. Neither "I'm pretty sure" nor "trust me" counts in either genre
— and neither counts on a comprehensive exam, where a committee member
who asks "how do you know that?" is doing exactly what these two
checkers automate.

**Brain power:** why does this module deliberately reuse Module 20's
exact single-byte XOR technique for `crackme.c`, rather than inventing a
harder, more "impressive" obfuscation scheme? Because the actual skill
this module is building isn't "know more obfuscation tricks" — it's
"recognize which known technique applies to a new-looking problem, and
execute it end to end, including proving your answer." A harder,
novel scheme would have tested a DIFFERENT skill (learning something
new under time pressure) instead of the one this module is actually
about (applying what you already know, completely, to a new target).

## A disclosure timeline is a promise, made of dates

`disclosure_timeline_checker.py` treats a set of four dates
(discovery, vendor contact, patch release, public disclosure) as
carrying real ethical weight — not just chronological trivia. Disclosing
before contacting the vendor at all is functionally the same choice as
skipping "ask permission before scanning" (Module 16's authorization
boundary) — a decision with real consequences for the people running the
affected system, made unilaterally by the researcher. The checker's
90-day-norm framing (a deviation to justify, not an automatic violation)
mirrors how real disclosure ethics actually work: there's a strong
default, and real, articulable reasons can override it, but "I just felt
like it" is never one of them.

## Self-test before moving on

- Explain why `solve_crackme.py`'s automatic `--verify` step matters —
  what could go wrong if the script just trusted its own regex match
  without running the real binary?
- Why does a research log with a results section but no `evidence`
  field fail this module's checker, even if the claimed finding is
  probably true?
- What's the single most common ethical mistake `disclosure_timeline_checker.py`
  is built to catch, and why does it matter more than the 90-day-window
  check specifically?
