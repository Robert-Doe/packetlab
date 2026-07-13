/**
 * Module 14 — JS/Node port of generate_conn_log.py. Same synthetic
 * traffic mix (normal + port scan + beaconing), same Zeek conn.log format.
 * Uses a small seeded PRNG (same technique as Module 07's UDP demo) so
 * output is reproducible.
 */
const fs = require("fs");

function makeSeededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const FIELDS = ["ts", "uid", "id.orig_h", "id.orig_p", "id.resp_h", "id.resp_p",
  "proto", "service", "duration", "orig_bytes", "resp_bytes"];

function makeRow(ts, uid, origH, origP, respH, respP, proto, service, duration, origBytes, respBytes) {
  return [ts.toFixed(6), uid, origH, origP, respH, respP, proto, service,
    duration.toFixed(6), origBytes, respBytes].join("\t");
}

function generate(seed = 42) {
  const rng = makeSeededRandom(seed);
  const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const randFloat = (min, max) => rng() * (max - min) + min;
  const choice = (arr) => arr[Math.floor(rng() * arr.length)];

  const rows = [];
  let t = 1700000000.0;
  let uidCounter = 0;
  const nextUid = () => `C${(++uidCounter).toString(16).padStart(6, "0")}`;

  for (let i = 0; i < 15; i++) {
    t += randFloat(2, 30);
    const src = choice(["192.168.1.10", "192.168.1.20"]);
    const dst = choice(["93.184.216.34", "142.250.72.14", "151.101.1.69"]);
    const [service, port] = choice([["dns", 53], ["http", 80], ["ssl", 443]]);
    rows.push(makeRow(t, nextUid(), src, randInt(49152, 65535), dst, port,
      service !== "dns" ? "tcp" : "udp", service,
      randFloat(0.01, 2.5), randInt(60, 2000), randInt(200, 8000)));
  }

  const scanStart = t + 5;
  const target = "192.168.1.99";
  const ports = new Set();
  while (ports.size < 40) ports.add(randInt(1, 1023));
  const portList = [...ports];
  portList.forEach((port, i) => {
    rows.push(makeRow(scanStart + i * 0.05, nextUid(), "192.168.1.30", 51000 + i,
      target, port, "tcp", "-", 0.0002, 0, 0));
  });
  t = scanStart + 40 * 0.05;

  const beaconStart = t + 20;
  for (let i = 0; i < 12; i++) {
    const jitter = randFloat(-1.5, 1.5);
    rows.push(makeRow(beaconStart + i * 60 + jitter, nextUid(), "192.168.1.10", 52000 + i,
      "203.0.113.66", 443, "tcp", "ssl", 0.15, randInt(180, 220), randInt(340, 380)));
  }

  rows.sort((a, b) => parseFloat(a.split("\t")[0]) - parseFloat(b.split("\t")[0]));
  return rows;
}

function main() {
  const rows = generate();
  const content = "#fields\t" + FIELDS.join("\t") + "\n" + rows.join("\n") + "\n";
  fs.writeFileSync("conn_node.log", content);
  console.log(`Wrote conn_node.log with ${rows.length} connection records ` +
    `(mixed: normal traffic + 1 port scan + 1 beaconing pattern).`);
}

main();
