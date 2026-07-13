# CTF Practice Progression Guide

This module's own `ctf_challenge/crackme.c` is deliberately an
EARLY-TIER reversing challenge — solvable with exactly the techniques
Module 20 already taught (strings/xxd inspection, single-byte XOR
brute-force). Real CTF skill comes from PROGRESSION: solving
increasingly harder challenges across increasingly many categories,
building a broader toolkit over time. This guide is honestly scoped as
a GUIDE (external platforms, not this course's own infrastructure) —
the crackme challenge above is the one piece of this progression this
course could build and test directly.

## Standard CTF categories, and which modules already prepared you

| Category | What it tests | Modules that prepared you |
|---|---|---|
| **Reversing** | Recovering hidden logic/data from a compiled binary | Module 00b (C internals), Module 20 (this course's own crackme) |
| **Pwn / binary exploitation** | Exploiting memory-safety bugs (buffer overflows, use-after-free) for code execution | Module 00b's `buffer_overflow_demo.c` is the conceptual foundation — real pwn challenges go further (ROP chains, heap exploitation), genuinely a specialization beyond this course's scope |
| **Web** | Exploiting web application vulnerabilities | Explicitly out of scope for THIS course (see this course's own README on scope) — a separate dedicated web-security course covers this territory |
| **Crypto** | Breaking weak/misused cryptographic schemes | Module 00a (modular arithmetic, DH), Module 13 (TLS/PKI) — real crypto CTF challenges often exploit exactly the KIND of weak-keyspace reasoning this module's Deep Theory covered (255-key brute force vs. 2^256 infeasibility) |
| **Forensics** | Recovering evidence/answers from a provided file (pcap, disk image, memory dump) | Module 18 directly — a real forensics CTF challenge is structurally identical to this course's own `incident_timeline.py` exercise, just with the "correct answer" being a flag string instead of a report |
| **Network / misc** | Protocol analysis, custom encodings, general problem solving | Modules 02–14 broadly — protocol-level literacy is the foundation |

## A realistic progression path

1. **picoCTF** (picoctf.org) — designed explicitly for beginners; every
   category above has entry-level challenges here. Start with
   Reversing and Forensics categories specifically — you have the most
   directly relevant preparation for those right now.
2. **CTFtime.org** — the aggregator for ongoing and upcoming CTF
   competitions worldwide; browse past competitions' challenge write-ups
   (many teams publish these) even without competing live, to see
   real solved-challenge reasoning end to end.
3. **Mid-tier practice platforms** (HackTheBox, TryHackMe's harder
   rooms, OverTheWire's `Narnia`/`Behemoth` wargames for pwn
   specifically) — once picoCTF-tier reversing/forensics feels
   comfortable, these platforms require chaining multiple techniques
   together, closer to the capstone's own "combine everything" spirit
   (Module 19).
4. **OSCP-style practice** (if pursuing offensive security specifically
   — TJnull's public OSCP-prep box list references real HackTheBox/
   VulnHub machines) — a different skill emphasis (full system
   compromise, privilege escalation, methodology under time pressure)
   than pure CTF challenge-solving, but a natural next step from
   Module 05's offensive-security material.

## Why this course stops at "the foundation," not full competitive readiness

Genuine CTF competitiveness (especially in pwn/crypto specifically)
requires depth this course's scope (a broad, PhD-comprehensive-exam
foundation across networking, security monitoring, and offensive/
defensive basics) was never meant to substitute for — real pwn
proficiency alone is often a semester-plus of dedicated study
(x86-64 calling conventions in exhaustive depth, ROP/JOP chain
construction, heap allocator internals, ASLR/PIE bypass techniques).
What this course DOES guarantee is that you recognize the VOCABULARY
and underlying PRINCIPLE in each category well enough to know what
you're looking at, ask the right follow-up questions, and know where to
go deeper — which is precisely the standard a comprehensive exam tests,
as distinct from the standard a CTF competition scoreboard tests.
