"""
Module 00a -- modular arithmetic, from clock-face intuition up to a REAL,
working (small-number) Diffie-Hellman key exchange. This fills a real gap
in the course: Module 13 covers X.509/TLS but never showed the raw
key-exchange math underneath it. DH is genuinely simple enough to run by
hand with small numbers, and this file does exactly that -- two
independent parties compute the same shared secret without ever
transmitting the secret itself, verified by comparing both sides' results.

WARNING: the numbers used here (p=23) are toy-sized for teaching, not
remotely secure -- real Diffie-Hellman uses primes with hundreds of
digits. Never use small primes like this for anything real.
"""


def mod_exp(base: int, exponent: int, modulus: int) -> int:
    """Fast modular exponentiation (square-and-multiply): computes
    base^exponent mod modulus WITHOUT ever computing the full,
    astronomically large base^exponent first. This exact algorithm is
    what makes RSA (Module 13's territory) and Diffie-Hellman practical --
    without it, computing a 2048-bit RSA signature would require a number
    with hundreds of digits before you could even take the modulus."""
    result = 1
    base = base % modulus
    while exponent > 0:
        if exponent % 2 == 1:  # if this bit of the exponent is set
            result = (result * base) % modulus
        exponent //= 2
        base = (base * base) % modulus
    return result


def naive_mod_exp(base: int, exponent: int, modulus: int) -> int:
    """The obvious, slow way -- compute the full power, THEN take the
    modulus. Correct, but computing base^exponent directly becomes
    impossibly large for real cryptographic key sizes. Used here only to
    verify mod_exp() is correct for small numbers where this is feasible."""
    return (base ** exponent) % modulus


def clock_arithmetic_demo():
    print("Clock arithmetic IS modular arithmetic:")
    print("  If it's 9 o'clock and 5 hours pass, it's not '14 o'clock' -- it's 2 o'clock.")
    print(f"  (9 + 5) mod 12 = {(9 + 5) % 12}")
    print("  Every 'wraps back to zero after N' behavior in networking is exactly this:")
    print(f"  TCP sequence numbers wrap mod 2^32 = {2**32}")
    print(f"  A TTL of 1, decremented past 0, would wrap mod 256 if nothing stopped it "
          f"(real routers instead DROP the packet at TTL=0 -- see Module 05's traceroute mechanics)")


def diffie_hellman_demo():
    print("Diffie-Hellman key exchange -- real math, small (INSECURE) numbers for clarity")
    print()

    # Publicly agreed, non-secret values -- anyone (including an eavesdropper) may know these.
    p = 23  # a small prime modulus
    g = 5   # a "generator" -- a specific number with a useful mathematical property mod p
    print(f"  Public parameters (anyone may know these): p={p}, g={g}")

    # Each side picks a SECRET number, never transmitted.
    alice_private = 6
    bob_private = 15
    print(f"  Alice's private number (never sent): {alice_private}")
    print(f"  Bob's private number (never sent):   {bob_private}")

    # Each side computes a PUBLIC value from their private number and sends THAT.
    alice_public = mod_exp(g, alice_private, p)
    bob_public = mod_exp(g, bob_private, p)
    print(f"\n  Alice computes and SENDS: g^a mod p = {g}^{alice_private} mod {p} = {alice_public}")
    print(f"  Bob computes and SENDS:   g^b mod p = {g}^{bob_private} mod {p} = {bob_public}")
    print("  (An eavesdropper now knows p, g, alice_public, bob_public -- but NOT either private number.)")

    # Each side combines the OTHER side's public value with their OWN private number.
    alice_shared = mod_exp(bob_public, alice_private, p)
    bob_shared = mod_exp(alice_public, bob_private, p)
    print(f"\n  Alice computes: bob_public^a mod p = {bob_public}^{alice_private} mod {p} = {alice_shared}")
    print(f"  Bob computes:   alice_public^b mod p = {alice_public}^{bob_private} mod {p} = {bob_shared}")

    print(f"\n  Shared secret match: {alice_shared == bob_shared}")
    print("  Both sides arrived at the SAME number, having never transmitted either")
    print("  private number OR the shared secret itself. This is the exact mathematical")
    print("  trick (modular exponentiation is easy forward, hard to reverse without the")
    print("  private exponent) underneath every TLS handshake's key exchange step.")
    return alice_shared == bob_shared


def main():
    clock_arithmetic_demo()

    print()
    print("=" * 70)
    print("Fast modular exponentiation, verified against the naive method")
    print("=" * 70)
    import random
    random.seed(1)
    mismatches = 0
    for _ in range(50):
        base = random.randint(2, 1000)
        exp = random.randint(2, 40)
        mod = random.randint(2, 10_000)
        fast = mod_exp(base, exp, mod)
        naive = naive_mod_exp(base, exp, mod)
        if fast != naive:
            mismatches += 1
            print(f"  MISMATCH: {base}^{exp} mod {mod}: fast={fast} naive={naive}")
    print(f"  {50 - mismatches}/50 trials matched between fast and naive methods.")
    print(f"  Example: 7^128 mod 13 = {mod_exp(7, 128, 13)} "
          f"(the naive method would first compute a {len(str(7**128))}-digit number)")

    print()
    print("=" * 70)
    diffie_hellman_demo()


if __name__ == "__main__":
    main()
