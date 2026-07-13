# Incident Report — [Your Lab Name]

*Delete this instruction line and everything in brackets before submitting.
Aim for 400-800 words total — long enough to stand alone, short enough
that a reader doesn't have to dig for the point.*

## Summary

[2-3 sentences: what happened, at a glance. A reader who stops here should
still understand the core story.]

## Timeline

[Pull directly from `incident_timeline.py`'s output — don't hand-summarize
away the specific evidence. Format as a numbered list with real
timestamps/offsets.]

1. `[T+0.00s]` ...
2. `[T+5.25s]` ...
3. `[T+35.47s]` ...

## Evidence

[For each major claim in your timeline, cite the SPECIFIC evidence: packet
numbers, payload contents, CVE numbers, log entries. "The attacker
exploited a known vulnerability" is not evidence. "Packet #6 contains the
payload `USER smiley:)`, the documented trigger for the vsftpd 2.3.4
backdoor, CVE-2011-2523" is evidence.]

## Detection

[Did your monitoring catch this? If yes, what specifically fired, and
how quickly relative to the actual event? If no, why not — what would
need to change for it to catch a similar incident in the future?]

## Root cause

[What SPECIFIC misconfiguration, missing patch, or process gap let this
happen? Not "the attacker was skilled" — what would need to be true about
your defenses for this NOT to have worked?]

## Remediation

[What did you actually do to fix it? Confirmed how? (Re-ran the attack,
confirmed it now fails — cite that confirmation specifically.)]

## Lessons for next time

[2-4 sentences. What would you do differently in your network design or
monitoring setup, based on this specific incident?]
