/**
 * Module 12 — JS/Node port of wifi_frame_builder.py. Same 802.11 beacon
 * frame structure, using Buffer instead of struct.
 */

function buildFrameControl(frameType, subtype) {
  const protocolVersion = 0;
  return protocolVersion | (frameType << 2) | (subtype << 4);
}

function buildBeaconFrame(bssidHex, ssid, beaconInterval = 100, channel = 6) {
  const fc = buildFrameControl(0, 8); // management, beacon
  const bssid = Buffer.from(bssidHex.replace(/:/g, ""), "hex");

  const header = Buffer.alloc(24);
  header.writeUInt16BE(fc, 0);
  header.writeUInt16BE(0, 2); // duration
  Buffer.alloc(6, 0xff).copy(header, 4); // DA: broadcast
  bssid.copy(header, 10); // SA
  bssid.copy(header, 16); // BSSID
  header.writeUInt16BE(0, 22); // sequence control

  const fixed = Buffer.alloc(12);
  // bytes 0-7: timestamp (left as 0)
  fixed.writeUInt16BE(beaconInterval, 8);
  fixed.writeUInt16BE(0x0411, 10); // capability info: ESS + privacy

  const ssidBuf = Buffer.from(ssid, "utf8");
  const ssidIe = Buffer.concat([Buffer.from([0, ssidBuf.length]), ssidBuf]);
  const channelIe = Buffer.from([3, 1, channel]);

  return Buffer.concat([header, fixed, ssidIe, channelIe]);
}

function parseFrameControl(fc) {
  return {
    protocolVersion: fc & 0b11,
    type: (fc >> 2) & 0b11,
    subtype: (fc >> 4) & 0b1111,
  };
}

const FRAME_TYPE_NAMES = { 0: "Management", 1: "Control", 2: "Data" };
const MGMT_SUBTYPE_NAMES = {
  0: "Association Request", 1: "Association Response", 4: "Probe Request",
  5: "Probe Response", 8: "Beacon", 11: "Authentication", 12: "Deauthentication",
};

function describeFrame(frame) {
  const fc = frame.readUInt16BE(0);
  const parsed = parseFrameControl(fc);
  const typeName = FRAME_TYPE_NAMES[parsed.type] || "Unknown";
  const subtypeName = parsed.type === 0 ? (MGMT_SUBTYPE_NAMES[parsed.subtype] || "Unknown") : "N/A";
  const bssid = frame.subarray(10, 16).toString("hex").match(/../g).join(":");

  const offset = 24 + 12;
  const ieTag = frame[offset];
  const ieLen = frame[offset + 1];
  const ssid = frame.subarray(offset + 2, offset + 2 + ieLen).toString("utf8");

  console.log(`  Frame Control: type=${parsed.type} (${typeName}), subtype=${parsed.subtype} (${subtypeName})`);
  console.log(`  BSSID: ${bssid}`);
  console.log(`  SSID (from tagged parameter, tag=${ieTag}): ${JSON.stringify(ssid)}`);
}

function main() {
  const frame = buildBeaconFrame("aa:bb:cc:11:22:33", "MyHomeNetwork", 100, 6);
  console.log(`Built a ${frame.length}-byte beacon frame:\n`);
  console.log("  " + frame.toString("hex"));
  console.log();
  describeFrame(frame);

  console.log("\nWhy this matters: every SSID your phone lists as 'available networks'");
  console.log("came from parsing exactly this frame type -- unencrypted, broadcast,");
  console.log("no association required. This is also why hiding your SSID (disabling");
  console.log("beacon SSID broadcast) provides near-zero real security: Probe Request/");
  console.log("Response frames (subtypes 4/5) still leak the SSID to anyone who");
  console.log("captures a device actively connecting, which happens constantly.");
}

main();
