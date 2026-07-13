"""
solve_crackme.py

A real CTF "reversing" solve script: the same single-byte XOR
brute-force technique from Module 20's string_deobfuscator.py, now
searching for a flag{...}-shaped string instead of an IP:port. This is
literally the standard workflow for a large fraction of real beginner
CTF reversing challenges -- extract the binary, brute-force a simple
obfuscation, recover the flag, and (this script's optional last step)
prove it by actually running the challenge binary against your
recovered answer.

Usage:
    python solve_crackme.py crackme            # find and print the flag
    python solve_crackme.py crackme --verify    # also run ./crackme <flag>
"""
import re
import subprocess
import sys

FLAG_PATTERN = re.compile(rb"flag\{[^}]{1,80}\}")


def xor_bytes(data: bytes, key: int) -> bytes:
    return bytes(b ^ key for b in data)


def find_flag(data: bytes):
    for key in range(1, 256):
        decoded = xor_bytes(data, key)
        match = FLAG_PATTERN.search(decoded)
        if match:
            return key, match.group().decode()
    return None, None


def main():
    if len(sys.argv) < 2:
        print("Usage: python solve_crackme.py <path-to-crackme-binary> [--verify]")
        sys.exit(1)

    path = sys.argv[1]
    verify = "--verify" in sys.argv

    with open(path, "rb") as f:
        data = f.read()

    print(f"[solve_crackme] loaded {len(data)} bytes from {path}")
    print("[solve_crackme] brute-forcing single-byte XOR keys for a flag{...} pattern...")

    key, flag = find_flag(data)
    if flag is None:
        print("[solve_crackme] no flag found under single-byte XOR. "
              "The real challenge may use a different obfuscation scheme.")
        sys.exit(1)

    print(f"[solve_crackme] found it. key=0x{key:02x}  flag={flag!r}")

    if verify:
        exec_path = path if ("/" in path or "\\" in path) else f"./{path}"
        print(f"[solve_crackme] verifying against the actual binary: {exec_path} {flag}")
        result = subprocess.run([exec_path, flag], capture_output=True, text=True)
        print(f"[solve_crackme] binary said: {result.stdout.strip()}")
        print(f"[solve_crackme] exit code: {result.returncode} "
              f"({'CONFIRMED CORRECT' if result.returncode == 0 else 'NOT CONFIRMED'})")


if __name__ == "__main__":
    main()
