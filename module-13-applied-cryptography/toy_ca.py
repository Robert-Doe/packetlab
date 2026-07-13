"""
Module 13 -- a real toy Certificate Authority: genuine RSA keys, genuine
X.509 certificates, genuine cryptographic signatures. This is not a
simulation of PKI -- `verify_chain()` below performs an actual signature
verification using the CA's real public key against the leaf certificate's
real signature bytes. If you tampered with a single byte of a real
certificate, this verification would genuinely fail, the same way a real
browser's certificate validation would.
"""
import datetime

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.x509.oid import NameOID


def generate_ca(common_name="Toy Root CA"):
    """A real, self-signed root CA: its own key signs its own certificate."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, common_name)])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)  # issuer == subject -> self-signed
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365))
        .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
        .add_extension(
            x509.KeyUsage(
                digital_signature=False, content_commitment=False, key_encipherment=False,
                data_encipherment=False, key_agreement=False, key_cert_sign=True,
                crl_sign=True, encipher_only=False, decipher_only=False,
            ),
            critical=True,
        )
        .sign(key, hashes.SHA256())
    )
    return key, cert


def issue_certificate(ca_key, ca_cert, common_name):
    """A leaf certificate, signed by the CA's key -- NOT self-signed."""
    leaf_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, common_name)])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)  # issuer is the CA, not the leaf itself
        .public_key(leaf_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=90))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.SubjectAlternativeName([x509.DNSName(common_name)]), critical=False)
        .sign(ca_key, hashes.SHA256())  # signed by the CA's key, not the leaf's own key
    )
    return leaf_key, cert


def verify_chain(leaf_cert, ca_cert) -> bool:
    """REAL signature verification: does the CA's public key actually
    validate the leaf certificate's signature? Raises InvalidSignature if not."""
    ca_cert.public_key().verify(
        leaf_cert.signature,
        leaf_cert.tbs_certificate_bytes,  # the "to be signed" bytes the signature covers
        padding.PKCS1v15(),
        leaf_cert.signature_hash_algorithm,
    )
    return True  # verify() raises on failure rather than returning False


def main():
    print("Generating a real root CA (RSA-2048, self-signed X.509 cert)...")
    ca_key, ca_cert = generate_ca()
    print(f"  CA subject: {ca_cert.subject.rfc4514_string()}")
    print(f"  CA is self-signed: subject == issuer -> {ca_cert.subject == ca_cert.issuer}")

    print("\nIssuing a leaf certificate for 'lab.test' (same zone as Module 08's DNS server)...")
    leaf_key, leaf_cert = issue_certificate(ca_key, ca_cert, "lab.test")
    print(f"  Leaf subject: {leaf_cert.subject.rfc4514_string()}")
    print(f"  Leaf issuer:  {leaf_cert.issuer.rfc4514_string()}")
    print(f"  Leaf is self-signed: {leaf_cert.subject == leaf_cert.issuer} (should be False)")

    print("\nVerifying the leaf's signature against the CA's public key...")
    ok = verify_chain(leaf_cert, ca_cert)
    print(f"  Chain verifies: {ok}")

    print("\nNow verifying against the WRONG CA (a second, unrelated root)...")
    _, wrong_ca_cert = generate_ca("A Different CA")
    try:
        verify_chain(leaf_cert, wrong_ca_cert)
        print("  Chain verifies: True  <-- this would be a serious bug if it happened")
    except Exception as e:
        print(f"  Chain verification FAILED (correctly): {type(e).__name__}")
        print("  This is exactly what a browser does when a site presents a cert")
        print("  signed by a CA your system doesn't trust -- 'certificate not trusted.'")

    # Save everything to disk for tls_handshake_demo.py to use
    with open("ca_cert.pem", "wb") as f:
        f.write(ca_cert.public_bytes(serialization.Encoding.PEM))
    with open("leaf_key.pem", "wb") as f:
        f.write(leaf_key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
        ))
    with open("leaf_cert.pem", "wb") as f:
        f.write(leaf_cert.public_bytes(serialization.Encoding.PEM))
    print("\nWrote ca_cert.pem, leaf_key.pem, leaf_cert.pem for tls_handshake_demo.py")


if __name__ == "__main__":
    main()
