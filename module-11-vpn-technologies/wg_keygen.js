/**
 * Module 11 — JS/Node port of wg_keygen.py. Same real X25519 key
 * generation using Node's built-in `crypto` module (no npm dependency
 * needed -- Node has shipped X25519 support natively since v12).
 *
 * SECURITY NOTE: same as the Python file -- treat generated private keys
 * as real secrets. Never commit them anywhere.
 */
const crypto = require("crypto");

function generateKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
  const privB64 = Buffer.from(privateKey.export({ format: "jwk" }).d, "base64url").toString("base64");
  const pubB64 = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("base64");
  return { priv: privB64, pub: pubB64 };
}

function derivePublicKey(privateKeyB64) {
  const rawPriv = Buffer.from(privateKeyB64, "base64");
  const jwk = {
    kty: "OKP",
    crv: "X25519",
    d: rawPriv.toString("base64url"),
    x: "", // placeholder -- createPrivateKey derives the real public part below
  };
  // Node needs a full JWK with SOME x value to import; derive the real
  // public key afterward via createPublicKey(privateKeyObject), which
  // recomputes it from the private scalar rather than trusting our
  // placeholder.
  const tempPub = crypto.generateKeyPairSync("x25519").publicKey.export({ format: "jwk" }).x;
  jwk.x = tempPub;
  const privateKeyObj = crypto.createPrivateKey({ key: jwk, format: "jwk" });
  const publicKeyObj = crypto.createPublicKey(privateKeyObj);
  const pubJwk = publicKeyObj.export({ format: "jwk" });
  return Buffer.from(pubJwk.x, "base64url").toString("base64");
}

if (require.main === module) {
  const { priv, pub } = generateKeypair();
  console.log(`PrivateKey = ${priv}`);
  console.log(`PublicKey  = ${pub}`);

  console.log("\nVerifying: deriving the public key from the private key independently...");
  const rederived = derivePublicKey(priv);
  console.log(`Re-derived  = ${rederived}`);
  console.log(`Match: ${rederived === pub}`);

  console.log(`\nKey length check: ${Buffer.from(priv, "base64").length} bytes ` +
    `(WireGuard/X25519 keys are always exactly 32 raw bytes)`);
}

module.exports = { generateKeypair, derivePublicKey };
