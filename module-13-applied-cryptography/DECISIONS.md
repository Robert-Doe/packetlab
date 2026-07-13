# Design Decisions — Module 13

## Why real X.509 certificates instead of a simplified mock structure

A mock "certificate" (a dict with subject/issuer/publickey fields) would
teach the vocabulary but not the actual security property: that a
signature can be independently verified without trusting the party who
presents it. Using the `cryptography` library's real
`CertificateBuilder`, real RSA keys, and real `.sign()`/`.verify()` calls
means `verify_chain()`'s failure case (wrong CA) is a genuine
cryptographic rejection (`InvalidSignature`), not a string comparison this
course decided to call a "failure." This is the same standard applied
throughout the course: Module 02's frames, Module 12's WPA2 keys, and this
module's certificates are all real bytes subject to real algorithms.

## Why toy_ca.py has no JS/Node port

Node's built-in `crypto` module can PARSE X.509 certificates
(`crypto.X509Certificate`) but has no built-in API for BUILDING and
signing new ones -- that capability requires either shelling out to
OpenSSL directly or an npm dependency (e.g. `node-forge` or
`@peculiar/x509`), neither of which is part of a default Node install.
Rather than add a dependency whose entire job is duplicating what
Python's `cryptography` library already does well, this module keeps
certificate/CA generation in Python and gives the JS side a more
valuable, genuinely distinct exercise: proving a completely independent
TLS implementation (Node's `tls` module) correctly validates a
Python-generated certificate. That's real cross-language interoperability
testing, not a language-parity gap.

## Why tls_client.js counts as this module's "JS variant" despite not porting toy_ca.py

Every other module's JS file ports the SAME logic as its Python
counterpart, to demonstrate language-agnosticism of a mechanism. This
module's more interesting demonstration is different: `tls_client.js`
proves that TLS/X.509 as a STANDARD produces identical real-world behavior
across totally independently-implemented TLS stacks (Python's OpenSSL
bindings vs. Node's own OpenSSL bindings, invoked through different APIs).
Confirmed during this module's testing: Node's rejection error message
(`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) reads differently from Python's
(`CERTIFICATE_VERIFY_FAILED`) but represents the identical underlying
cryptographic fact -- which is itself a useful, concrete lesson about how
the same standard surfaces different error text in different libraries.

## Why this module documents the Windows curl/schannel revocation-checking discovery

During this module's own testing, `curl --cacert ca_cert.pem` failed on
Windows with `CERT_TRUST_REVOCATION_STATUS_UNKNOWN` even though the
certificate chain was completely valid -- caused by Windows curl's
schannel backend performing CRL/OCSP revocation checking that a toy CA
(with no revocation infrastructure) cannot satisfy. Confirmed the
certificate itself was fine by retrying with `--ssl-no-revoke`, which
succeeded. This is called out explicitly in the tutorial rather than
silently avoided, because it's a genuinely useful real-world lesson about
different TLS library behaviors (OpenSSL-based Python/Node vs.
Windows-native schannel) that a student would otherwise find confusing and
potentially misattribute to their own certificate being broken.

## Why RSA-2048 instead of ECDSA for the toy CA

RSA remains the most widely recognized key type in certificate tooling and
documentation a student is likely to encounter first (browser certificate
inspectors, OpenSSL's default examples). ECDSA is faster and produces
smaller signatures, and would be a reasonable Exercise addition, but
starting with the more universally-recognized algorithm keeps the
student's first mental model aligned with the most common real-world
default.
