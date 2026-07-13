"""
Module 12 -- REAL WPA2-PSK key derivation, not a simulation of it.

The PMK (Pairwise Master Key) in WPA2-Personal is computed exactly this
way by every real access point and client: PBKDF2-HMAC-SHA1 over your
Wi-Fi passphrase, salted with the SSID, 4096 iterations, 256-bit output.
This is RFC 2898 (PBKDF2) applied exactly as IEEE 802.11i specifies.

Verified against a test vector that's been published and cited across
WPA2 security literature for years (SSID "IEEE", passphrase "password"):
    PMK = f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e
This script reproduces that exact value -- confirmed during this module's
build (see tutorial.html Step 1).
"""
import hashlib
import hmac as hmac_module


def derive_pmk(passphrase: str, ssid: str) -> bytes:
    """The actual WPA2-PSK PMK derivation, per IEEE 802.11i / RFC 2898."""
    if not (8 <= len(passphrase) <= 63):
        raise ValueError("WPA2 passphrases must be 8-63 characters")
    return hashlib.pbkdf2_hmac("sha1", passphrase.encode(), ssid.encode(), 4096, dklen=32)


def prf(key: bytes, label: bytes, data: bytes, length_bytes: int) -> bytes:
    """IEEE 802.11i's PRF: HMAC-SHA1 in counter mode, used to expand the
    PMK (256 bits) into a full PTK (384 bits for CCMP/AES)."""
    result = b""
    counter = 0
    while len(result) < length_bytes:
        result += hmac_module.new(key, label + b"\x00" + data + bytes([counter]), hashlib.sha1).digest()
        counter += 1
    return result[:length_bytes]


def derive_ptk(pmk: bytes, aa: bytes, spa: bytes, anonce: bytes, snonce: bytes) -> bytes:
    """Expands the PMK into a PTK using both sides' MAC addresses and
    nonces -- this is what Message 2/3 of the 4-way handshake exchange
    enough information for BOTH sides to compute independently."""
    mac_min, mac_max = (aa, spa) if aa < spa else (spa, aa)
    nonce_min, nonce_max = (anonce, snonce) if anonce < snonce else (snonce, anonce)
    data = mac_min + mac_max + nonce_min + nonce_max
    return prf(pmk, b"Pairwise key expansion", data, 48)  # 384 bits for CCMP/AES


def main():
    print("=== PMK derivation, verified against a known published test vector ===")
    pmk = derive_pmk("password", "IEEE")
    expected = "f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e"
    print(f"  PMK (SSID='IEEE', passphrase='password'): {pmk.hex()}")
    print(f"  Expected (published test vector):          {expected}")
    print(f"  Match: {pmk.hex() == expected}")

    print("\n=== Your own home network's PMK (for illustration -- change these) ===")
    my_pmk = derive_pmk("correcthorsebattery", "MyHomeNetwork")
    print(f"  SSID='MyHomeNetwork', passphrase='correcthorsebattery'")
    print(f"  PMK: {my_pmk.hex()}")
    print("  (Real WPA2 hardware computes exactly this, once, when you first")
    print("   type your Wi-Fi password -- then reuses this PMK for every")
    print("   subsequent 4-way handshake, which is why changing your Wi-Fi")
    print("   password forces every device to redo this expensive derivation.)")


if __name__ == "__main__":
    main()
