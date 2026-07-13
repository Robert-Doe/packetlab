"""
Module 00a -- binary/hex conversion and bitwise logic, built from scratch
(not just calling Python's own int(x, 2) / hex() / bin()) so the actual
mechanics are visible. Every function here is cross-checked against
Python's built-ins in main()'s self-test.

Why this matters for everything else in this course: Module 04's subnet
math is entirely bitwise AND/OR/NOT on 32-bit integers. Module 02's
struct.pack calls are placing values into specific bit positions. Module
12's WPA2 key derivation and Module 13's RSA both depend on modular
arithmetic, which this file's sibling (modular_arithmetic.py) covers.
"""


def decimal_to_binary(n: int) -> str:
    """Converts a non-negative integer to a binary string, built by hand
    using repeated division-by-2 (the actual algorithm, not a library call)."""
    if n == 0:
        return "0"
    digits = []
    while n > 0:
        digits.append(str(n % 2))
        n //= 2
    return "".join(reversed(digits))


def binary_to_decimal(b: str) -> int:
    """Place-value expansion: each bit is worth 2^position, counting from
    the right, starting at position 0. This IS what 'binary' means."""
    total = 0
    for i, bit in enumerate(reversed(b)):
        total += int(bit) * (2 ** i)
    return total


def decimal_to_hex(n: int) -> str:
    """Same repeated-division algorithm as decimal_to_binary, just base 16
    instead of base 2 -- the algorithm doesn't care what the base is."""
    if n == 0:
        return "0"
    digits = "0123456789abcdef"
    result = []
    while n > 0:
        result.append(digits[n % 16])
        n //= 16
    return "".join(reversed(result))


def hex_to_decimal(h: str) -> int:
    digits = "0123456789abcdef"
    total = 0
    for char in h.lower():
        total = total * 16 + digits.index(char)
    return total


def binary_to_hex_by_grouping(b: str) -> str:
    """The shortcut every network engineer uses instead of going through
    decimal: since 16 = 2^4, every group of exactly 4 binary digits maps
    to exactly one hex digit, with no math required beyond memorizing 16
    four-bit patterns. Pad the binary string on the LEFT to a multiple of
    4 first."""
    padded = b.rjust((len(b) + 3) // 4 * 4, "0")
    groups = [padded[i:i + 4] for i in range(0, len(padded), 4)]
    return "".join(decimal_to_hex(binary_to_decimal(g)) for g in groups)


# ---------------------------------------------------- bitwise operations --
def bitwise_and_demo(a: int, b: int) -> int:
    return a & b


def bitwise_or_demo(a: int, b: int) -> int:
    return a | b


def bitwise_xor_demo(a: int, b: int) -> int:
    return a ^ b


def show_subnet_mask_as_and(ip_octet: int, mask_octet: int):
    """This IS Module 04's entire subnetting mechanism, at the single-byte
    level: network = IP AND mask, bit by bit."""
    ip_bin = decimal_to_binary(ip_octet).rjust(8, "0")
    mask_bin = decimal_to_binary(mask_octet).rjust(8, "0")
    result = ip_octet & mask_octet
    result_bin = decimal_to_binary(result).rjust(8, "0")
    print(f"    IP octet:    {ip_bin}  ({ip_octet})")
    print(f"    Mask octet:  {mask_bin}  ({mask_octet})")
    print(f"    AND result:  {result_bin}  ({result})")


def _self_test():
    """Cross-checks every hand-rolled function above against Python's own
    built-ins, across a spread of values."""
    import random
    random.seed(0)
    mismatches = 0
    for _ in range(200):
        n = random.randint(0, 100_000)
        if decimal_to_binary(n) != bin(n)[2:]:
            print(f"MISMATCH (dec->bin) at n={n}")
            mismatches += 1
        if decimal_to_hex(n) != hex(n)[2:]:
            print(f"MISMATCH (dec->hex) at n={n}")
            mismatches += 1
        if binary_to_decimal(bin(n)[2:]) != n:
            print(f"MISMATCH (bin->dec) at n={n}")
            mismatches += 1
        if hex_to_decimal(hex(n)[2:]) != n:
            print(f"MISMATCH (hex->dec) at n={n}")
            mismatches += 1
        if binary_to_hex_by_grouping(bin(n)[2:]) != hex(n)[2:].rjust(len(binary_to_hex_by_grouping(bin(n)[2:])), "0"):
            # grouping shortcut may produce extra leading zero hex digits from padding -- compare as integers instead
            if hex_to_decimal(binary_to_hex_by_grouping(bin(n)[2:])) != n:
                print(f"MISMATCH (grouping) at n={n}")
                mismatches += 1
    print(f"Self-test: {200 - mismatches}/200 trials matched Python's built-ins.")
    return mismatches == 0


def main():
    print("=" * 70)
    print("Base conversions, by hand")
    print("=" * 70)
    for n in [10, 255, 192, 65535]:
        b = decimal_to_binary(n)
        h = decimal_to_hex(n)
        print(f"  {n:>6} decimal = {b:>16} binary = 0x{h} hex")

    print()
    print("=" * 70)
    print("The 4-bits-per-hex-digit shortcut (why network engineers skip decimal)")
    print("=" * 70)
    for b in ["11111111", "11000000", "10101010"]:
        h = binary_to_hex_by_grouping(b)
        print(f"  binary {b} -> hex {h}  (grouped: {' '.join([b[i:i+4] for i in range(0, len(b), 4)])})")

    print()
    print("=" * 70)
    print("Subnet masking IS bitwise AND -- Module 04's entire mechanism, one octet at a time")
    print("=" * 70)
    print("  192.168.1.69 AND 255.255.255.192 (a /26 mask), last octet:")
    show_subnet_mask_as_and(69, 192)

    print()
    print("=" * 70)
    print("XOR: the 'differences only' operator (checksums, one-time pads, CRC)")
    print("=" * 70)
    a, b = 0b10110101, 0b11010011
    print(f"  {decimal_to_binary(a).rjust(8, '0')} XOR")
    print(f"  {decimal_to_binary(b).rjust(8, '0')}")
    print(f"  {'-' * 8}")
    print(f"  {decimal_to_binary(a ^ b).rjust(8, '0')}  <- a 1 wherever the bits DIFFER, 0 wherever they match")

    print()
    print("=" * 70)
    print("Self-test against Python's built-ins")
    print("=" * 70)
    _self_test()


if __name__ == "__main__":
    main()
