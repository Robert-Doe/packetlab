/* crackme.c
 *
 * A real, solvable CTF-style "reversing" challenge, in the same genre
 * as an early picoCTF or beginner CTF reversing problem: find the flag
 * hidden inside this compiled binary and submit it back to the program.
 *
 * This is a genuine step up from Module 20's beacon_demo, not a copy:
 * beacon_demo's obfuscated data was a NETWORK TARGET the program used
 * for itself; this program's obfuscated data is a SECRET the program
 * checks YOUR input against, which is the actual structure of almost
 * every CTF "reversing" flag-check challenge. The exact same class of
 * technique from Module 20 (single-byte XOR, brute-forceable) applies
 * -- this module is about the CTF WORKFLOW (find it, prove it, submit
 * it) built on tools you already have.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define XOR_KEY 0x37

/* "flag{r3vers1ng_1s_ju5t_r34d1ng}" XORed with 0x37, computed at build time */
static unsigned char encoded_flag[] = {
    0x51,0x5b,0x56,0x50,0x4c,0x45,0x04,0x41,0x52,0x45,0x44,0x06,0x59,0x50,
    0x68,0x06,0x44,0x68,0x5d,0x42,0x02,0x43,0x68,0x45,0x04,0x03,0x53,0x06,
    0x59,0x50,0x4a
};
static const size_t encoded_len = sizeof(encoded_flag);

int main(int argc, char **argv) {
    if (argc != 2) {
        printf("Usage: %s <flag>\n", argv[0]);
        printf("This is a CTF-style reversing challenge. Find the flag "
               "some other way -- static analysis, not by reading this "
               "source file -- then submit it here to confirm.\n");
        return 1;
    }

    unsigned char real_flag[64];
    for (size_t i = 0; i < encoded_len; i++) {
        real_flag[i] = encoded_flag[i] ^ XOR_KEY;
    }
    real_flag[encoded_len] = '\0';

    if (strcmp(argv[1], (const char *)real_flag) == 0) {
        printf("CORRECT. Well done -- that's a real recovered flag, not a guess.\n");
        return 0;
    }

    printf("INCORRECT.\n");
    return 1;
}
