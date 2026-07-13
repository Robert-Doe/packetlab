/**
 * Module 12 — JS/Node port of wpa2_psk_derivation.py. Same real WPA2-PSK
 * PMK derivation (PBKDF2-HMAC-SHA1) and PTK expansion (802.11i PRF),
 * using Node's built-in `crypto` module -- no dependency needed.
 */
const crypto = require("crypto");

function derivePmk(passphrase, ssid) {
  if (passphrase.length < 8 || passphrase.length > 63) {
    throw new Error("WPA2 passphrases must be 8-63 characters");
  }
  return crypto.pbkdf2Sync(passphrase, ssid, 4096, 32, "sha1");
}

function prf(key, label, data, lengthBytes) {
  const chunks = [];
  let total = 0;
  let counter = 0;
  while (total < lengthBytes) {
    const hmac = crypto.createHmac("sha1", key);
    hmac.update(Buffer.concat([label, Buffer.from([0]), data, Buffer.from([counter])]));
    const chunk = hmac.digest();
    chunks.push(chunk);
    total += chunk.length;
    counter += 1;
  }
  return Buffer.concat(chunks).subarray(0, lengthBytes);
}

function derivePtk(pmk, aa, spa, anonce, snonce) {
  const [macMin, macMax] = Buffer.compare(aa, spa) < 0 ? [aa, spa] : [spa, aa];
  const [nonceMin, nonceMax] = Buffer.compare(anonce, snonce) < 0 ? [anonce, snonce] : [snonce, anonce];
  const data = Buffer.concat([macMin, macMax, nonceMin, nonceMax]);
  return prf(pmk, Buffer.from("Pairwise key expansion"), data, 48);
}

if (require.main === module) {
  console.log("=== PMK derivation, verified against a known published test vector ===");
  const pmk = derivePmk("password", "IEEE");
  const expected = "f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e";
  console.log(`  PMK (SSID='IEEE', passphrase='password'): ${pmk.toString("hex")}`);
  console.log(`  Expected (published test vector):          ${expected}`);
  console.log(`  Match: ${pmk.toString("hex") === expected}`);

  console.log("\n=== Your own home network's PMK (for illustration -- change these) ===");
  const myPmk = derivePmk("correcthorsebattery", "MyHomeNetwork");
  console.log(`  SSID='MyHomeNetwork', passphrase='correcthorsebattery'`);
  console.log(`  PMK: ${myPmk.toString("hex")}`);
}

module.exports = { derivePmk, prf, derivePtk };
