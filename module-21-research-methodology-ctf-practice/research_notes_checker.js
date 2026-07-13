/**
 * research_notes_checker.js
 *
 * Node port of research_notes_checker.py -- identical checks, identical
 * completeness scoring.
 *
 * Usage:
 *   node research_notes_checker.js sample_research_log_complete.json
 */
const fs = require("fs");

function checkResearchQuestion(log) {
  const issues = [];
  const rq = (log.research_question || "").trim();
  if (!rq) {
    issues.push("No research question stated at all.");
  } else if (rq.split(/\s+/).length < 5) {
    issues.push(
      `Research question ('${rq}') is too short to be a real, specific question -- a comprehensive exam question needs enough specificity to be falsifiable, not just a topic name.`
    );
  }
  if (!rq.trim().endsWith("?")) {
    issues.push(
      "Research question does not end in '?' -- state it as an actual question, not a topic statement."
    );
  }
  return issues;
}

function checkRelatedWork(log) {
  const issues = [];
  const related = log.related_work || [];
  if (related.length < 2) {
    issues.push(
      `Only ${related.length} related work entr(y/ies) -- a real literature review needs enough prior work cited to show you know what's already been done, not just one paper.`
    );
  }
  related.forEach((entry, i) => {
    if (!entry.citation) {
      issues.push(`related_work[${i}] has no citation.`);
    }
    if (!entry.relevance) {
      issues.push(
        `related_work[${i}] (${entry.citation || "?"}) has no stated relevance -- citing a paper without saying HOW it relates to your question is not a literature review.`
      );
    }
  });
  return issues;
}

function checkMethodology(log) {
  const issues = [];
  const methodology = log.methodology || {};
  if (!methodology.description) {
    issues.push("No methodology description -- how would someone else reproduce this work?");
  }
  if (!methodology.ethics_statement) {
    issues.push(
      "No ethics/authorization statement -- for security research specifically, this is not optional (see Module 16's authorization-boundary theory, and this module's responsible-disclosure material)."
    );
  }
  return issues;
}

function checkResultsAndLimitations(log) {
  const issues = [];
  const results = log.results || {};
  if (!results.summary) {
    issues.push("No results summary.");
  }
  if (!results.evidence) {
    issues.push(
      "Results claim findings but cite no evidence -- an unsupported claim is not a finding, the same evidence-to-conclusion standard Module 18's forensic reconstruction required."
    );
  }
  const limitations = log.limitations || [];
  if (limitations.length === 0) {
    issues.push(
      "No stated limitations -- every real study has some; a research writeup with zero acknowledged limitations reads as either incomplete or overconfident, both of which a comprehensive exam committee will notice."
    );
  }
  return issues;
}

function runChecker(log) {
  let allIssues = [];
  allIssues = allIssues.concat(checkResearchQuestion(log));
  allIssues = allIssues.concat(checkRelatedWork(log));
  allIssues = allIssues.concat(checkMethodology(log));
  allIssues = allIssues.concat(checkResultsAndLimitations(log));

  const totalChecks = 4;
  const categories = new Set();
  for (const i of allIssues) {
    const low = i.toLowerCase();
    if (low.includes("question")) categories.add("question");
    if (low.includes("related work") || low.includes("related_work")) categories.add("related");
    if (low.includes("methodology") || low.includes("ethics")) categories.add("methodology");
    if (low.includes("results") || low.includes("limitation")) categories.add("results");
  }
  const completenessPct = Math.round((100 * (totalChecks - categories.size)) / totalChecks);

  return { issues: allIssues, completeness_pct: completenessPct };
}

function main() {
  const filePath = process.argv[2] || "sample_research_log_complete.json";
  const log = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const result = runChecker(log);
  console.log(`Research notes checker -- ${filePath}\n`);
  console.log(`Completeness: ${result.completeness_pct}%\n`);

  if (result.issues.length === 0) {
    console.log("No gaps found. Every section is present and structurally sound.");
  } else {
    console.log(`${result.issues.length} gap(s) found:`);
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

main();
