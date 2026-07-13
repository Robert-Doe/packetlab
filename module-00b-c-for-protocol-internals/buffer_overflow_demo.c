/*
 * Module 00b -- a classic, deliberately vulnerable buffer overflow,
 * for MEMORY-SAFETY EDUCATION ONLY. This demonstrates that writing past
 * the end of a fixed-size buffer corrupts ADJACENT memory -- it does NOT
 * construct shellcode, hijack control flow, or achieve code execution.
 * That's a meaningfully different (and out of scope here) topic; this
 * file's entire point is "why do bounds-checked functions exist," not
 * "how to build a working exploit."
 *
 * Compile TWO ways to see TWO different outcomes:
 *
 *   1. Normal (modern gcc's default stack protector ON):
 *        gcc -Wall -o overflow_protected buffer_overflow_demo.c
 *        ./overflow_protected
 *      Expected: the program detects the corruption and aborts safely
 *      ("*** stack smashing detected ***"). This is what real production
 *      binaries look like today -- the mitigation actually works.
 *
 *   2. Protections explicitly disabled (to see the RAW bug):
 *        gcc -Wall -fno-stack-protector -o overflow_unprotected buffer_overflow_demo.c
 *        ./overflow_unprotected
 *      Expected: no abort -- the program runs to completion having
 *      silently corrupted the adjacent variable, which the program then
 *      prints, proving the corruption happened.
 */
#include <stdio.h>
#include <string.h>

void vulnerable_copy(const char *attacker_controlled_input) {
    char small_buffer[8];      /* only 8 bytes of legitimate space */
    int adjacent_guard = 0x1234; /* a variable that (with protections off) typically sits right after small_buffer on the stack */

    printf("  adjacent_guard BEFORE copy: 0x%x\n", adjacent_guard);

    /* THE BUG: strcpy() has no idea how big small_buffer actually is --
     * it copies bytes until it hits a null terminator in the SOURCE
     * string, no matter how long that is. This is precisely why strcpy()
     * is considered dangerous and functions like strncpy()/snprintf(),
     * which take an explicit maximum length, exist instead. */
    strcpy(small_buffer, attacker_controlled_input);

    printf("  small_buffer now contains:  %s\n", small_buffer);
    printf("  adjacent_guard AFTER copy:  0x%x\n", adjacent_guard);

    if (adjacent_guard != 0x1234) {
        printf("  >>> adjacent_guard was CORRUPTED by the overflow. <<<\n");
    } else {
        printf("  adjacent_guard is unchanged (input fit, or your compiler's\n");
        printf("  stack layout put something else adjacent -- see DECISIONS.md)\n");
    }
}

int main(void) {
    /* Unbuffered stdout: if the stack protector aborts the process
     * (SIGABRT), buffered output that hadn't been flushed yet would be
     * lost silently -- confirmed the hard way while testing this file:
     * the "protected" build's printf() calls never appeared until this
     * line was added, because the abort happened before the buffer's
     * normal flush point (a newline flush wasn't enough here either,
     * since a full abort skips the usual stdio cleanup). */
    setvbuf(stdout, NULL, _IONBF, 0);

    printf("Copying a 20-byte string into an 8-byte buffer with strcpy()...\n\n");
    vulnerable_copy("AAAAAAAAAAAAAAAAAAAA");  /* 20 'A's -- deliberately far longer than 8 bytes */
    return 0;
}
