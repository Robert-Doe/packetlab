/**
 * Module 14 — JS/Node port of conn_log_analyzer.py. Same port-scan and
 * beaconing detection logic (including the same port-constancy and
 * minimum-interval refinements discovered during this module's testing).
 */
const fs = require("fs");

function parseConnLog(path) {
  const lines = fs.readFileSync(path, "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
  return lines.map((line) => {
    const [ts, uid, origH, origP, respH, respP, proto, service, duration, origBytes, respBytes] = line.split("\t");
    return {
      ts: parseFloat(ts), uid, origH, origP: Number(origP), respH, respP: Number(respP),
      proto, service, duration: parseFloat(duration), origBytes: Number(origBytes), respBytes: Number(respBytes),
    };
  });
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pstdev(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

function detectPortScans(rows, windowSeconds = 10, minDistinctPorts = 15) {
  const bySrcDst = new Map();
  for (const r of rows) {
    const key = `${r.origH}|${r.respH}`;
    if (!bySrcDst.has(key)) bySrcDst.set(key, []);
    bySrcDst.get(key).push(r);
  }

  const findings = [];
  for (const [key, conns] of bySrcDst) {
    const [src, dst] = key.split("|");
    conns.sort((a, b) => a.ts - b.ts);
    let windowPorts = new Set();
    let windowStartTs = null;
    for (const r of conns) {
      if (windowStartTs === null || r.ts - windowStartTs > windowSeconds) {
        windowStartTs = r.ts;
        windowPorts = new Set();
      }
      windowPorts.add(r.respP);
      if (windowPorts.size >= minDistinctPorts) {
        findings.push({ type: "port_scan", src, dst, distinctPorts: windowPorts.size, windowSeconds, firstTs: windowStartTs });
        break;
      }
    }
  }
  return findings;
}

function detectBeaconing(rows, minOccurrences = 6, maxJitterRatio = 0.15, minIntervalSeconds = 1.0) {
  const bySrcDstPort = new Map();
  for (const r of rows) {
    const key = `${r.origH}|${r.respH}|${r.respP}`;
    if (!bySrcDstPort.has(key)) bySrcDstPort.set(key, []);
    bySrcDstPort.get(key).push(r);
  }

  const findings = [];
  for (const [key, conns] of bySrcDstPort) {
    const [src, dst, port] = key.split("|");
    if (conns.length < minOccurrences) continue;
    conns.sort((a, b) => a.ts - b.ts);
    const intervals = [];
    for (let i = 1; i < conns.length; i++) intervals.push(conns[i].ts - conns[i - 1].ts);
    if (intervals.length < minOccurrences - 1) continue;

    const meanInterval = mean(intervals);
    if (meanInterval < minIntervalSeconds) continue;
    const jitterRatio = meanInterval ? pstdev(intervals) / meanInterval : Infinity;

    if (jitterRatio <= maxJitterRatio) {
      findings.push({
        type: "beaconing", src, dst, port: Number(port), occurrences: conns.length,
        meanIntervalS: Math.round(meanInterval * 100) / 100, jitterRatio: Math.round(jitterRatio * 1000) / 1000,
      });
    }
  }
  return findings;
}

function main() {
  const path = process.argv[2] || "conn_node.log";
  const rows = parseConnLog(path);
  console.log(`Loaded ${rows.length} connection records from ${path}\n`);

  console.log("=".repeat(70));
  console.log("Port scan detection");
  console.log("=".repeat(70));
  const scans = detectPortScans(rows);
  if (scans.length === 0) console.log("  (none found)");
  for (const f of scans) {
    console.log(`  ALERT: ${f.src} touched ${f.distinctPorts} distinct ports on ${f.dst} ` +
      `within ${f.windowSeconds}s -- looks like a port scan`);
  }

  console.log();
  console.log("=".repeat(70));
  console.log("Beaconing detection");
  console.log("=".repeat(70));
  const beacons = detectBeaconing(rows);
  if (beacons.length === 0) console.log("  (none found)");
  for (const f of beacons) {
    console.log(`  ALERT: ${f.src} -> ${f.dst}:${f.port}: ${f.occurrences} connections, ` +
      `avg interval ${f.meanIntervalS}s, jitter ratio ${f.jitterRatio} ` +
      `(low jitter = suspiciously regular = possible C2 beacon)`);
  }
}

main();
