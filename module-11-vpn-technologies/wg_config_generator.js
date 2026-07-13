/**
 * Module 11 — JS/Node port of wg_config_generator.py. Same real,
 * cryptographically valid two-peer config generation, using
 * wg_keygen.js's real X25519 key generation.
 */
const { generateKeypair } = require("./wg_keygen.js");

function buildConfigs({
  peerAName = "laptop",
  peerBName = "vps",
  peerATunnelIp = "10.10.0.1/24",
  peerBTunnelIp = "10.10.0.2/24",
  peerBEndpoint = "203.0.113.50:51820",
  listenPort = 51820,
} = {}) {
  const { priv: aPriv, pub: aPub } = generateKeypair();
  const { priv: bPriv, pub: bPub } = generateKeypair();

  const configA =
    `# ${peerAName}.conf -- run \`wg-quick up ./${peerAName}.conf\` on ${peerAName}\n` +
    `[Interface]\n` +
    `PrivateKey = ${aPriv}\n` +
    `Address = ${peerATunnelIp}\n\n` +
    `[Peer]\n` +
    `# this is ${peerBName}\n` +
    `PublicKey = ${bPub}\n` +
    `Endpoint = ${peerBEndpoint}\n` +
    `AllowedIPs = ${peerBTunnelIp.split("/")[0]}/32\n` +
    `PersistentKeepalive = 25\n`;

  const configB =
    `# ${peerBName}.conf -- run \`wg-quick up ./${peerBName}.conf\` on ${peerBName}\n` +
    `[Interface]\n` +
    `PrivateKey = ${bPriv}\n` +
    `Address = ${peerBTunnelIp}\n` +
    `ListenPort = ${listenPort}\n\n` +
    `[Peer]\n` +
    `# this is ${peerAName}\n` +
    `PublicKey = ${aPub}\n` +
    `AllowedIPs = ${peerATunnelIp.split("/")[0]}/32\n`;

  return { configA, configB };
}

function main() {
  const { configA, configB } = buildConfigs();

  console.log("=".repeat(70));
  console.log("laptop.conf");
  console.log("=".repeat(70));
  console.log(configA);

  console.log("=".repeat(70));
  console.log("vps.conf");
  console.log("=".repeat(70));
  console.log(configB);

  console.log("=".repeat(70));
  console.log("Notes");
  console.log("=".repeat(70));
  console.log("- 'laptop' has no ListenPort -- it initiates the connection outward,");
  console.log("  same as any client. 'vps' needs a fixed ListenPort because it's the");
  console.log("  side other peers connect TO (change the Endpoint IP to your real");
  console.log("  second machine's real reachable address before using this for real).");
  console.log("- AllowedIPs on each side is deliberately narrow (/32, just the other");
  console.log("  peer's single tunnel address) -- this is a point-to-point tunnel,");
  console.log("  not a full site-to-site VPN routing whole subnets. Exercise 2 asks");
  console.log("  you to widen this for a site-to-site scenario.");
  console.log("- PersistentKeepalive on the client side helps it stay reachable");
  console.log("  through NAT (Module 10) -- without it, the vps side's replies might");
  console.log("  arrive after the laptop's NAT/firewall state entry has expired.");
}

if (require.main === module) {
  if (process.argv[2] === "--self-test") {
    const { configA: a1 } = buildConfigs();
    const { configA: a2 } = buildConfigs();
    if (!a1.includes("PrivateKey = ") || !a1.includes("PublicKey = ")) {
      throw new Error("config missing expected fields");
    }
    if (a1 === a2) {
      throw new Error("two runs produced identical keys -- randomness is broken");
    }
    console.log("Self-test passed: configs are well-formed and keys are unique per run.");
  } else {
    main();
  }
}

module.exports = { buildConfigs };
