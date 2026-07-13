# Design Decisions — Module 21

## Why crackme.c reuses Module 20's exact XOR technique instead of a novel obfuscation scheme

A brand-new, more sophisticated obfuscation scheme would have made this
module's own CTF challenge feel more "advanced," but at the cost of
requiring the student to learn a whole new technique just to practice
the actual point of this module: the CTF WORKFLOW (recognize the
challenge category, apply a known technique, recover a flag, PROVE it by
submitting it back). Reusing the identical single-byte-XOR-brute-force
technique from Module 20 deliberately, on a differently-shaped problem
(a comparison target instead of a network address), demonstrates that
one real technique, once learned, generalizes across superficially
different problems — exactly the transfer-of-skill a real CTF (and a
comprehensive exam) rewards.

## Why solve_crackme.py includes an automatic --verify step against the real binary

A CTF solve isn't complete when you've merely computed something that
LOOKS like a flag — it's complete when the challenge itself confirms it.
Automating the verification step (actually invoking `./crackme <found
flag>` and checking its exit code) closes the loop for real, the same
"don't just assert, actually test" discipline this course has applied
since Module 05's routing bug and Module 19's capstone
firewall-verification requirement. It's also an honest safeguard against
a false-positive flag pattern match — the regex could theoretically
match something that isn't the real flag; running the actual binary is
the ground-truth check.

## Why the JS `--verify` step is documented as a known cross-platform limitation, not silently worked around

During this module's build, `node solve_crackme.js crackme --verify`
failed to execute the compiled binary when run from Windows Node.js,
because `crackme` is a Linux ELF executable produced by WSL's gcc, and
Windows cannot natively execute ELF binaries. This was NOT hidden or
"fixed" by silently changing the recommended workflow — it's documented
directly, both here and in `tutorial.html`, as a genuine consequence of
this course's mixed WSL/Windows environment (the same category of
cross-platform nuance Module 00b and Module 00c already surfaced
honestly). The underlying flag-recovery logic itself (the part that
matters for the CTF-workflow lesson) IS confirmed byte-identical between
Python and Node; only the OPTIONAL execution-confirmation step requires
running from within WSL, where Python (not Node) is installed by
default in this build's environment.

## Why research_notes_checker.py and disclosure_timeline_checker.py exist as separate tools, not one combined "research module" checker

Module 19's `capstone_checker.py` validates ONE coherent project's
internal consistency. This module's two checkers validate two genuinely
different things: whether a piece of RESEARCH WRITING has the right
structural pieces (a documentation-quality check), and whether a
DISCLOSURE TIMELINE'S dates are internally consistent with real CVD
norms (a date-arithmetic correctness check). These are different enough
in KIND — one is about textual/structural completeness, the other is
about numeric/temporal consistency — that combining them into one tool
would have made neither check's logic as clear, the same
separation-of-concerns reasoning Module 14's DECISIONS.md applied when
distinguishing port-scan detection from beaconing detection as separate
functions rather than one tangled detector.

## Why disclosure_timeline_checker.py enforces a 90-day standard window as a norm, not a hard rule

The checker explicitly frames early disclosure (before 90 days, with no
patch) as a "deviation from standard CVD norms" requiring documented
justification — NOT as an error. This is accurate to how coordinated
disclosure actually works in practice: the 90-day convention (associated
publicly with Google Project Zero's disclosure policy, among others) is
a widely-adopted norm, not a law, and legitimate reasons to deviate exist
(active exploitation observed in the wild, an unresponsive vendor after
repeated contact attempts). Framing every early disclosure as an
unconditional "issue" would misrepresent the field's actual practice;
framing it as "flag for explicit justification" matches how a real
comprehensive exam question about disclosure ethics would expect you to
reason — norms with documented exceptions, not absolute rules.
