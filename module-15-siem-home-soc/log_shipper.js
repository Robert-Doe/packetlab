/**
 * Module 15 — JS/Node port of log_shipper.py. Same alerts.jsonl and real
 * Elasticsearch Bulk API NDJSON output formats.
 */
const fs = require("fs");

function alertToDocument(alert) {
  return {
    ...alert,
    timestamp: new Date().toISOString(),
    sourceModule: "module-14-network-security-monitoring",
  };
}

function writeJsonl(alerts, path = "alerts_node.jsonl") {
  const content = alerts.map((a) => JSON.stringify(alertToDocument(a))).join("\n") + "\n";
  fs.writeFileSync(path, content);
  return path;
}

function writeBulkNdjson(alerts, indexName = "module15-alerts", path = "bulk_node.ndjson") {
  const lines = [];
  for (const alert of alerts) {
    lines.push(JSON.stringify({ index: { _index: indexName } }));
    lines.push(JSON.stringify(alertToDocument(alert)));
  }
  const content = lines.join("\n") + "\n";
  fs.writeFileSync(path, content);
  return path;
}

function validateBulkNdjson(path) {
  const lines = fs.readFileSync(path, "utf8").split("\n").filter((l) => l);
  if (lines.length % 2 !== 0) {
    throw new Error("bulk file must have an even number of lines (action + source pairs)");
  }
  for (let i = 0; i < lines.length; i += 2) {
    const action = JSON.parse(lines[i]);
    JSON.parse(lines[i + 1]);
    if (!("index" in action) && !("create" in action)) {
      throw new Error(`line ${i}: expected an 'index' or 'create' action, got ${lines[i]}`);
    }
  }
  return true;
}

const SAMPLE_ALERTS = [
  { type: "port_scan", src: "192.168.1.30", dst: "192.168.1.99", distinctPorts: 40, windowSeconds: 10 },
  { type: "beaconing", src: "192.168.1.10", dst: "203.0.113.66", port: 443, occurrences: 12, meanIntervalS: 59.87, jitterRatio: 0.02 },
  { type: "ids_signature", sid: "1000001", msg: "Possible SQL injection attempt", src: "192.168.1.45", dst: "10.0.0.5" },
];

function main() {
  const jsonlPath = writeJsonl(SAMPLE_ALERTS);
  console.log(`Wrote ${jsonlPath} (${SAMPLE_ALERTS.length} documents, Logstash json_lines format)`);
  const firstLine = fs.readFileSync(jsonlPath, "utf8").split("\n")[0];
  console.log(`  first line: ${firstLine}`);

  const bulkPath = writeBulkNdjson(SAMPLE_ALERTS);
  console.log(`\nWrote ${bulkPath} (Elasticsearch Bulk API NDJSON format)`);
  const ok = validateBulkNdjson(bulkPath);
  console.log(`  Self-validation (well-formed action/source pairs): ${ok}`);
  const lines = fs.readFileSync(bulkPath, "utf8").split("\n").filter((l) => l);
  console.log(`  ${lines.length} lines total (${lines.length / 2} action/source pairs)`);
  console.log(`  line 0 (action): ${lines[0]}`);
  console.log(`  line 1 (source): ${lines[1]}`);
}

main();
