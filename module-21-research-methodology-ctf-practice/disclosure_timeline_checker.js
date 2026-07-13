/**
 * disclosure_timeline_checker.js
 *
 * Node port of disclosure_timeline_checker.py -- identical CVD timeline
 * validation logic and identical date arithmetic (using UTC-midnight
 * Date objects to avoid timezone-induced off-by-one day errors, the
 * same class of bug this course's own pcap timestamp mismatch in
 * Module 18 taught to watch for).
 *
 * Usage:
 *   node disclosure_timeline_checker.js sample_disclosure_complete.json
 */
const fs = require("fs");

const STANDARD_WINDOW_DAYS = 90;
const PATCH_LEAD_TOLERANCE_DAYS = 3;

function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysBetween(aMs, bMs) {
  return Math.round((bMs - aMs) / 86400000);
}

function checkTimeline(entry) {
  const issues = [];
  const discovery = parseDate(entry.discovery_date);
  const vendorContacted = entry.vendor_contacted_date;
  const publicDisclosure = parseDate(entry.public_disclosure_date);
  const patchReleased = entry.patch_released_date;

  if (!vendorContacted) {
    issues.push(
      "No vendor_contacted_date at all -- this is FULL DISCLOSURE, not COORDINATED disclosure. Not automatically wrong, but a deliberate choice that should be justified explicitly, not an accidental omission."
    );
    return issues;
  }

  const vendorContactedD = parseDate(vendorContacted);

  if (vendorContactedD < discovery) {
    issues.push(
      `vendor_contacted_date (${vendorContacted}) is BEFORE discovery_date (${entry.discovery_date}) -- impossible timeline, check your dates.`
    );
  }

  if (publicDisclosure < vendorContactedD) {
    issues.push(
      `public_disclosure_date (${entry.public_disclosure_date}) is BEFORE vendor_contacted_date (${vendorContacted}) -- this is full disclosure with no coordination window at all, the single most common way researchers unintentionally cause vendor/legal friction.`
    );
  }

  const daysToDisclosure = daysBetween(vendorContactedD, publicDisclosure);

  if (!patchReleased) {
    if (daysToDisclosure < STANDARD_WINDOW_DAYS) {
      issues.push(
        `Public disclosure happened ${daysToDisclosure} day(s) after vendor contact, before both the standard ${STANDARD_WINDOW_DAYS}-day window AND before any patch was released. This deviates from standard CVD norms -- legitimate reasons exist (active exploitation observed in the wild, vendor unresponsive), but the reason should be documented explicitly, not implicit.`
      );
    }
  } else {
    const patchD = parseDate(patchReleased);
    const leadDays = daysBetween(patchD, publicDisclosure);
    if (leadDays < -PATCH_LEAD_TOLERANCE_DAYS) {
      issues.push(
        `public_disclosure_date is ${Math.abs(leadDays)} day(s) BEFORE patch_released_date -- users are told about the vulnerability before they have any way to protect themselves. Standard practice is to disclose ON or shortly AFTER patch release, not before.`
      );
    }
  }

  return issues;
}

function runChecker(manifest) {
  const allIssues = [];
  const entries = manifest.disclosures || [];
  const flaggedIds = new Set();

  for (const entry of entries) {
    const entryIssues = checkTimeline(entry);
    for (const issue of entryIssues) {
      allIssues.push(`[${entry.id || "?"}] ${issue}`);
      flaggedIds.add(entry.id || "?");
    }
  }

  const cleanCount = entries.length - flaggedIds.size;
  const completenessPct = entries.length ? Math.round((100 * cleanCount) / entries.length) : 0;

  return { issues: allIssues, completeness_pct: completenessPct, total_entries: entries.length };
}

function main() {
  const filePath = process.argv[2] || "sample_disclosure_complete.json";
  const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const result = runChecker(manifest);
  console.log(`Disclosure timeline checker -- ${filePath}\n`);
  console.log(
    `${result.total_entries} disclosure(s) checked. ${result.completeness_pct}% fully compliant with standard CVD norms.\n`
  );

  if (result.issues.length === 0) {
    console.log("No timeline issues found.");
  } else {
    console.log(`${result.issues.length} issue(s) found:`);
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

main();
