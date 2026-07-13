/**
 * Module 14 — JS/Node port of mini_ids_rules.py. Same Suricata/Snort-style
 * rule syntax parsing and content matching.
 */

function parseRule(ruleText) {
  const m = ruleText.trim().match(/^(\w+)\s+(\w+)\s+(\S+)\s+(\S+)\s*->\s*(\S+)\s+(\S+)\s*\((.*)\)\s*$/);
  if (!m) throw new Error(`couldn't parse rule: ${ruleText}`);
  const [, action, proto, src, srcPort, dst, dstPort, optionsText] = m;

  const options = {};
  for (const opt of optionsText.split(";")) {
    const trimmed = opt.trim();
    if (!trimmed) continue;
    if (trimmed.includes(":")) {
      const idx = trimmed.indexOf(":");
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
      options[key] = value;
    } else {
      options[trimmed] = true;
    }
  }

  return {
    action, proto, src, srcPort, dst, dstPort,
    msg: options.msg || "", content: options.content ?? null, sid: options.sid,
    nocase: "nocase" in options,
  };
}

function matchRule(rule, payload) {
  if (rule.content === null) return false;
  const haystack = rule.nocase ? payload.toLowerCase() : payload;
  const needle = rule.nocase ? rule.content.toLowerCase() : rule.content;
  return haystack.includes(needle);
}

function runEngine(rules, packets) {
  const alerts = [];
  packets.forEach((packet, i) => {
    for (const rule of rules) {
      if (matchRule(rule, packet)) {
        alerts.push({ packetIndex: i, payload: packet, sid: rule.sid, msg: rule.msg });
      }
    }
  });
  return alerts;
}

const DEFAULT_RULES_TEXT = [
  'alert tcp any any -> any any (msg:"Possible SQL injection attempt"; content:"OR 1=1"; nocase; sid:1000001;)',
  'alert tcp any any -> any any (msg:"Possible directory traversal"; content:"../../etc/passwd"; sid:1000002;)',
  'alert http any any -> any any (msg:"Suspicious User-Agent: sqlmap"; content:"sqlmap"; nocase; sid:1000003;)',
  'alert tcp any any -> any any (msg:"Cleartext password field"; content:"password="; nocase; sid:1000004;)',
];

const SAMPLE_TRAFFIC = [
  "GET /search?q=laptops HTTP/1.1\r\nHost: shop.example",
  "GET /login?user=admin&password=hunter2 HTTP/1.1\r\nHost: shop.example",
  "GET /products?id=5 OR 1=1-- HTTP/1.1\r\nHost: shop.example",
  "GET /files?path=../../etc/passwd HTTP/1.1\r\nHost: shop.example",
  "GET /api/status HTTP/1.1\r\nHost: shop.example\r\nUser-Agent: Mozilla/5.0",
  "GET /admin HTTP/1.1\r\nHost: shop.example\r\nUser-Agent: sqlmap/1.7.2",
  "GET /about HTTP/1.1\r\nHost: shop.example",
];

function main() {
  const rules = DEFAULT_RULES_TEXT.map(parseRule);
  console.log(`Loaded ${rules.length} rules:`);
  for (const r of rules) console.log(`  sid:${r.sid} -- ${r.msg}`);

  console.log(`\nScanning ${SAMPLE_TRAFFIC.length} packets of sample traffic...\n`);
  const alerts = runEngine(rules, SAMPLE_TRAFFIC);

  if (alerts.length === 0) console.log("No alerts.");
  for (const a of alerts) {
    console.log(`ALERT [sid:${a.sid}] ${a.msg}`);
    console.log(`  packet #${a.packetIndex}: ${a.payload.slice(0, 70)}`);
    console.log();
  }

  console.log(`${alerts.length} alert(s) out of ${SAMPLE_TRAFFIC.length} packets inspected.`);
}

main();
