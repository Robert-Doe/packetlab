"""
Module 11 -- generates REAL WireGuard-compatible key pairs. These are not
placeholder strings -- they're genuine X25519 private/public keys, base64
encoded in the exact format `wg genkey` / `wg pubkey` produce, using the
same elliptic-curve primitive (Curve25519) WireGuard itself uses.

You could take this script's output and paste it directly into a real
WireGuard config file and it would work correctly -- the only thing this
course can't do FOR you is install the WireGuard app and run the tunnel
itself (see DECISIONS.md and tutorial.html).

SECURITY NOTE: a WireGuard private key is a secret, equivalent in
sensitivity to an SSH private key or a password. Never commit real
generated keys to a public repository or share them outside your own
devices. Every key this script prints during its own demo run is
discarded the moment the process exits -- generate your OWN keys for any
tunnel you actually intend to use.
"""
import base64

from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
)


def generate_keypair():
    """Returns (private_key_b64, public_key_b64), matching `wg genkey`'s output format exactly."""
    private_key = X25519PrivateKey.generate()
    private_bytes = private_key.private_bytes(
        encoding=Encoding.Raw, format=PrivateFormat.Raw, encryption_algorithm=NoEncryption()
    )
    public_bytes = private_key.public_key().public_bytes(
        encoding=Encoding.Raw, format=PublicFormat.Raw
    )
    return base64.b64encode(private_bytes).decode(), base64.b64encode(public_bytes).decode()


def derive_public_key(private_key_b64: str) -> str:
    """Equivalent to `wg pubkey`: given a private key, derive its public key."""
    private_bytes = base64.b64decode(private_key_b64)
    private_key = X25519PrivateKey.from_private_bytes(private_bytes)
    public_bytes = private_key.public_key().public_bytes(
        encoding=Encoding.Raw, format=PublicFormat.Raw
    )
    return base64.b64encode(public_bytes).decode()


if __name__ == "__main__":
    priv, pub = generate_keypair()
    print(f"PrivateKey = {priv}")
    print(f"PublicKey  = {pub}")

    print("\nVerifying: deriving the public key from the private key independently...")
    rederived = derive_public_key(priv)
    print(f"Re-derived  = {rederived}")
    print(f"Match: {rederived == pub}")

    print(f"\nKey length check: {len(base64.b64decode(priv))} bytes "
          f"(WireGuard/X25519 keys are always exactly 32 raw bytes)")
