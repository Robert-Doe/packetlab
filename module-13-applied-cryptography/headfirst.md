# Head First: A Certificate Is a Signed Claim, Nothing More

## Anyone can claim to be anything. Only a CA's signature makes it mean something.

`issue_certificate()` puts whatever `common_name` string you pass it
directly into the certificate's Subject field — there's no verification
inside that function that the requester actually controls `lab.test`, or
any domain at all. If certificates were just "a name plus a public key,"
anyone could claim to be anyone. The entire security property of PKI comes
from ONE additional fact: the certificate is also signed by a CA's private
key, and that signature can be checked against the CA's public key by
anyone, without needing the CA to be involved in that check at all.

**Brain power:** `verify_chain(leaf_cert, wrong_ca_cert)` fails with
`InvalidSignature` — not because the leaf certificate's CONTENT is wrong
(the subject, the dates, the public key are all perfectly well-formed) but
because the SIGNATURE doesn't mathematically correspond to
`wrong_ca_cert`'s public key. This is the entire trick: a certificate's
trustworthiness has nothing to do with what it claims about itself, and
everything to do with whether a signature you can independently check
traces back to a root you already decided to trust.

## Your browser trusts roughly 100 organizations, and that's the whole system

When Attempt 2 failed in Step 2/3, it's because neither Python's nor
Node's default trust store contains our toy CA — and it shouldn't, because
we made it up five minutes ago. Real browsers ship with a curated list of
perhaps 100-150 root CAs that operating system vendors and browser makers
have vetted and decided to trust on your behalf. Every "secure" HTTPS
connection you've ever made ultimately traces back, through a chain of
signatures, to one of those roots. This module's Step 1 "wrong CA" failure
IS, mechanically, the exact same check your browser performs thousands of
times a day, just with a root you happen to know is untrustworthy because
you generated it yourself thirty seconds ago.

## TLS 1.3's handshake is doing two completely different jobs at once

Notice `tls_client.py` printed both a negotiated CIPHER (symmetric
encryption for the actual data) and validated a CERTIFICATE (asymmetric
signature verification for identity). These solve two unrelated problems:
symmetric ciphers are fast but need both sides to already share a secret
key; asymmetric crypto (what your certificate's signature relies on) can
establish trust and exchange a key without a pre-shared secret, but is
computationally expensive to use for bulk data. TLS's actual design: use
asymmetric crypto ONCE, briefly, during the handshake, to authenticate the
server and agree on a fresh symmetric key — then switch to fast symmetric
encryption for all the real data that follows. This is the same "expensive
setup, cheap ongoing use" pattern you'll recognize from Module 12's WPA2
PMK (expensive PBKDF2, once) versus PTK (cheap per-session symmetric keys,
derived from it).

## Self-test before moving on

- If an attacker could get you to trust a fraudulent root CA certificate
  (e.g., installing malware that adds one to your system trust store),
  what specifically would that let them do to your HTTPS traffic, given
  everything you now know about how certificate validation works?
- Why does `toy_ca.py`'s `issue_certificate()` function not need to verify
  that the requester actually controls the domain named in
  `common_name` for THIS module's purposes — and why would a real,
  publicly-trusted CA absolutely need to perform that verification before
  issuing a certificate?
- In one sentence, why does TLS use asymmetric crypto only briefly during
  the handshake, then switch to symmetric encryption for the actual data?
