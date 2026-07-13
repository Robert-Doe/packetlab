/**
 * Module 19 — JS/Node port of capstone_checker.py. Same 4 consistency
 * checks (network enforcement, monitoring, vulnerability remediation,
 * incident report completeness).
 */
const fs = require("fs");

function checkNetworkConsistency(manifest) {
  const issues = [];
  const network = manifest.network || {};
  const vlans = network.vlans || [];
  const firewallRules = network.firewall_rules || [];

  const firewallPairs = new Set(firewallRules.map((r) => `${r.from}|${r.to}|${r.action}`));

  for (const vlan of vlans) {
    for (const rule of vlan.isolation_rules || []) {
      const key = `${rule.from}|${rule.to}|${rule.action}`;
      if (!firewallPairs.has(key)) {
        issues.push(
          `VLAN '${vlan.name}' declares isolation rule ${rule.from} -> ${rule.to} ` +
          `(${rule.action}) but no matching firewall rule was found -- the plan isn't enforced.`
        );
      }
    }
  }
  return issues;
}

function checkMonitoring(manifest) {
  const issues = [];
  const monitoring = manifest.monitoring || {};
  if (!monitoring.siem_active) {
    issues.push("SIEM/monitoring pipeline is not marked active.");
  }
  const detectors = monitoring.detectors || [];
  if (detectors.length < 2) {
    issues.push(`Only ${detectors.length} detector type(s) active -- expected at least 2 ` +
      `(e.g. port_scan + beaconing, per Module 14).`);
  }
  return issues;
}

function checkVulnerabilities(manifest) {
  const issues = [];
  const findings = (manifest.vulnerability_assessment || {}).findings || [];
  if (findings.length === 0) {
    issues.push("No vulnerability assessment findings recorded at all -- did you actually run a scan (Module 16)?");
  }
  for (const f of findings) {
    if (!f.remediated) {
      issues.push(`Finding '${f.id || "?"}' (${f.description || ""}) was never marked remediated.`);
    }
  }
  return issues;
}

function checkIncidentReport(manifest) {
  const issues = [];
  const report = manifest.incident_report || {};
  const wordCount = report.word_count || 0;
  if (wordCount < 150) {
    issues.push(`Incident report is only ${wordCount} words -- a real incident report ` +
      `(Module 18) needs enough detail to stand alone: what happened, in what order, ` +
      `what evidence supports each claim.`);
  }
  return issues;
}

function runChecker(manifest) {
  const allIssues = [
    ...checkNetworkConsistency(manifest),
    ...checkMonitoring(manifest),
    ...checkVulnerabilities(manifest),
    ...checkIncidentReport(manifest),
  ];

  const totalChecks = 4;
  const categoriesWithIssues = new Set();
  if (allIssues.some((i) => i.includes("VLAN"))) categoriesWithIssues.add("network");
  if (allIssues.some((i) => i.includes("SIEM") || i.includes("detector"))) categoriesWithIssues.add("monitoring");
  if (allIssues.some((i) => i.includes("emediat") || i.includes("assessment"))) categoriesWithIssues.add("vulns");
  if (allIssues.some((i) => i.includes("Incident report"))) categoriesWithIssues.add("incident");

  const completenessPct = Math.round((100 * (totalChecks - categoriesWithIssues.size)) / totalChecks);
  return { issues: allIssues, completenessPct };
}

function main() {
  const path = process.argv[2] || "sample_manifest_complete.json";
  const manifest = JSON.parse(fs.readFileSync(path, "utf8"));

  const result = runChecker(manifest);
  console.log(`Capstone checker -- ${path}\n`);
  console.log(`Completeness: ${result.completenessPct}%\n`);

  if (result.issues.length === 0) {
    console.log("No gaps found. Every section is present and internally consistent.");
  } else {
    console.log(`${result.issues.length} gap(s) found:`);
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

main();
