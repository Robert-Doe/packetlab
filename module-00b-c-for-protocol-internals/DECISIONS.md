# Design Decisions — Module 00b

## Why C content is tested via WSL rather than skipped as "not runnable"

This course's build environment is Windows, and no native C compiler
(gcc, clang, MSVC's cl) was available directly. Rather than treat C
content the way genuinely un-testable infrastructure (Modules 06, 09, 15,
17) was handled -- guides without execution -- WSL Ubuntu was confirmed
available and DOES provide a real Linux gcc toolchain, so every C file in
this module was actually compiled and run, with real output captured,
consistent with this course's standard of testing everything that can be
tested.

## Why buffer_overflow_demo.c stops at observable corruption, not exploitation

Constructing actual shellcode or a working control-flow hijack (jumping
to attacker-chosen code) is a meaningfully different skill and risk
category than understanding WHY and HOW a buffer overflow corrupts
memory. This module's goal -- Tier 0 prerequisite literacy in "buffer-level
bugs" -- is fully served by observing real, visible corruption
(`adjacent_guard` becoming `0x41414141`, a real segfault from corrupted
stack metadata) without building offensive tooling that belongs, if ever
built in this course, alongside Module 16's authorized-lab-only framing.

## Why the module shows BOTH the protected and unprotected build, rather than just demonstrating the raw bug

Showing only the unprotected build would leave a student with an outdated
mental model -- "buffer overflows just corrupt things," full stop -- when
real modern binaries almost universally ship with stack protection
enabled by default. Showing both, and specifically documenting the
unexpected finding that `adjacent_guard` stayed unchanged in the
protected build (because GCC's stack protector reorders locals, not just
adds a canary), teaches a more accurate and more exam-relevant picture:
mitigations are real, layered, and worth understanding precisely, not
hand-waved as "the compiler fixes it now."

## Why setvbuf(stdout, NULL, _IONBF, 0) was added after initial testing

The first version of `buffer_overflow_demo.c` lost its own printf()
output when the protected build aborted via SIGABRT -- confirmed during
this module's testing, buffered stdout was never flushed before the
abort killed the process. This is itself a small but genuine lesson about
stdio buffering and abnormal process termination, documented in the
source comment rather than silently fixed with no explanation, consistent
with how other modules in this course handle bugs caught during testing.

## Why memory_safety_contrast.js exists instead of a "JS port" of the overflow demo

JavaScript has no raw pointers, no manually-managed stack frames, and no
mechanism to reproduce C's specific undefined-behavior-driven corruption
-- porting the overflow bug directly isn't possible in a meaningful sense.
Instead, this file answers the more useful question the C demo raises:
what DOES happen in a memory-safe language given the same "write more
than fits" operation? Testing confirmed two genuinely different safe
behaviors (Buffer.write()'s silent truncation vs. Uint8Array.set()'s
RangeError) rather than assuming a single uniform answer -- both are
included because the DIFFERENCE between them is itself instructive: "safe"
doesn't mean "one universal behavior," it means "the runtime enforces
SOME bounds-respecting behavior, whichever one the API designer chose,"
in clear contrast to C's total absence of any such enforcement.

## Why this module has no direct "JS port" pattern for protocol_struct.c or pointers_and_memory.c

Those two files are fundamentally about C-specific concepts (packed
struct memory layout, raw pointer arithmetic) that don't have a
meaningful equivalent to port -- JS has no direct analog to a raw memory
pointer or unmanaged struct layout. Module 02's `layer_builder.py` and
its own JS port already cover "build these same protocol bytes in two
languages"; this module's C files exist specifically to show the LOWER
LAYER underneath what struct.pack/Buffer do automatically, which is a
C-specific lesson by nature, not a gap in language coverage.
