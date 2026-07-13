/**
 * Module 12 — JS/Node port of wpa_handshake_sim.py. Same 4-way handshake
 * simulation, same real PTK convergence check.
 */
const crypto = require("crypto");
const { derivePmk, derivePtk } = require("./wpa2_psk_derivation.js");

class WpaEndpoint {
  constructor(name, macHex, pmk) {
    this.name = name;
    this.mac = Buffer.from(macHex.replace(/:/g, ""), "hex");
    this.pmk = pmk;
    this.nonce = crypto.randomBytes(32);
    this.ptk = null;
  }

  computePtk(peerMac, peerNonce) {
    const [aa, spa] = this.name === "AP" ? [this.mac, peerMac] : [peerMac, this.mac];
    const anonce = this.name === "AP" ? this.nonce : peerNonce;
    const snonce = this.name === "AP" ? peerNonce : this.nonce;
    this.ptk = derivePtk(this.pmk, aa, spa, anonce, snonce);
    return this.ptk;
  }
}

function simulateHandshake(passphrase, ssid) {
  const pmk = derivePmk(passphrase, ssid);
  console.log(`Both sides already share the PMK (derived once at connection time, SSID=${JSON.stringify(ssid)}):`);
  console.log(`  PMK = ${pmk.toString("hex")}\n`);

  const ap = new WpaEndpoint("AP", "aa:bb:cc:00:00:01", pmk);
  const sta = new WpaEndpoint("STA", "aa:bb:cc:00:00:02", pmk);

  console.log("Message 1/4: AP -> STA");
  console.log(`  AP sends ANonce = ${ap.nonce.toString("hex").slice(0, 16)}... (unencrypted -- this is fine, a nonce isn't secret)`);

  console.log("\nMessage 2/4: STA -> AP");
  console.log("  STA now has both MACs + both nonces (its own SNonce + AP's ANonce) -- computes PTK:");
  const staPtk = sta.computePtk(ap.mac, ap.nonce);
  console.log(`  STA's PTK = ${staPtk.toString("hex")}`);
  console.log(`  STA sends SNonce = ${sta.nonce.toString("hex").slice(0, 16)}... plus a MIC proving it holds the right PMK`);

  console.log("\nMessage 3/4: AP -> STA");
  console.log("  AP now ALSO has both MACs + both nonces -- computes its own PTK independently:");
  const apPtk = ap.computePtk(sta.mac, sta.nonce);
  console.log(`  AP's PTK  = ${apPtk.toString("hex")}`);
  console.log("  AP verifies STA's MIC (proves STA holds the correct PMK), sends its own MIC + GTK");

  console.log("\nMessage 4/4: STA -> AP");
  console.log("  STA verifies AP's MIC, confirms handshake complete. Both sides now encrypt");
  console.log("  data traffic using keys derived from PTK (never the PTK/PMK directly).");

  const match = apPtk.equals(staPtk);
  console.log(`\nPTKs match (computed independently, never transmitted): ${match}`);
  return match;
}

if (require.main === module) {
  const ok = simulateHandshake("correcthorsebattery", "MyHomeNetwork");
  console.log(`\n${ok ? "PASS" : "FAIL"}: both endpoints converged on the identical PTK ` +
    `without either one ever transmitting it.`);
}
