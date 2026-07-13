/**
 * Module 17 — JS/Node port of sg_rule_auditor.py. Same 3-tier security
 * group model, same sensitive-port list, same misconfigured example.
 */

const SENSITIVE_PORTS = {
  22: "SSH", 3389: "RDP", 3306: "MySQL", 5432: "PostgreSQL",
  27017: "MongoDB", 6379: "Redis", 9200: "Elasticsearch", 5601: "Kibana",
};

const WIDE_OPEN_CIDRS = new Set(["0.0.0.0/0", "::/0"]);

function auditSecurityGroup(sg) {
  const findings = [];
  for (const rule of sg.ingress || []) {
    const { fromPort, toPort, cidrBlocks = [], sourceSg } = rule;

    if (sourceSg) continue; // referencing another SG, not a raw CIDR -- the good pattern

    const wideOpen = cidrBlocks.some((c) => WIDE_OPEN_CIDRS.has(c));
    if (!wideOpen) continue;

    for (const [portStr, service] of Object.entries(SENSITIVE_PORTS)) {
      const port = Number(portStr);
      if (fromPort <= port && port <= toPort) {
        findings.push({
          securityGroup: sg.name, severity: "critical", port, service,
          issue: `${service} (port ${port}) is open to the entire internet (0.0.0.0/0)`,
        });
      }
    }

    if (fromPort === 0 && toPort >= 65535) {
      findings.push({
        securityGroup: sg.name, severity: "critical", port: `${fromPort}-${toPort}`, service: "ALL",
        issue: "Every port is open to the entire internet (0.0.0.0/0) -- this rule has no meaningful restriction at all",
      });
    }
  }
  return findings;
}

function auditAll(securityGroups) {
  return securityGroups.flatMap(auditSecurityGroup);
}

const SAMPLE_SECURITY_GROUPS = [
  {
    name: "web-sg",
    ingress: [
      { fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
      { fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
    ],
  },
  {
    name: "app-sg",
    ingress: [{ fromPort: 8080, toPort: 8080, sourceSg: "web-sg" }],
  },
  {
    name: "db-sg",
    ingress: [{ fromPort: 3306, toPort: 3306, sourceSg: "app-sg" }],
  },
  {
    name: "db-sg-MISCONFIGURED-example",
    ingress: [
      { fromPort: 3306, toPort: 3306, cidrBlocks: ["0.0.0.0/0"] },
      { fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    ],
  },
];

function main() {
  console.log(`Auditing ${SAMPLE_SECURITY_GROUPS.length} security groups ` +
    `(matching terraform/main.tf's real 3-tier design, plus one bad example)...\n`);

  const findings = auditAll(SAMPLE_SECURITY_GROUPS);

  if (findings.length === 0) console.log("No issues found.");
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.securityGroup}: ${f.issue}`);
  }

  console.log(`\n${findings.length} finding(s) across ${SAMPLE_SECURITY_GROUPS.length} security groups.`);
  console.log("\nNotice web-sg, app-sg, and db-sg (the REAL terraform/main.tf design)");
  console.log("produced ZERO findings -- app-sg and db-sg use security-group references,");
  console.log("not raw CIDR blocks, which is exactly the pattern that keeps them off");
  console.log("this list. Only the deliberately misconfigured example was flagged.");
}

main();
