# Head First: A SIEM Is Just "Module 14, But It Never Stops Running"

## You already built the hard part

Everything genuinely difficult about security monitoring — deciding what
counts as suspicious, writing the actual detection logic — was Module
14's job, and you already did it. A SIEM (Security Information and Event
Management system) doesn't add new detection intelligence on top of that.
What it adds is PLUMBING: a place for findings to accumulate over time
(Elasticsearch), a way to visually explore accumulated history (Kibana),
and a way to build always-visible dashboards instead of re-running a
script and reading terminal output once (Grafana). The move from Module
14 to Module 15 is the move from "I ran a detector once and got an
answer" to "detectors run continuously and their answers pile up
somewhere I can look at any time."

**Brain power:** `log_shipper.py` writes each alert as its own JSON
object, one per line, rather than one big JSON array. Why does Elasticsearch's
real Bulk API specifically require this newline-delimited format instead
of a normal JSON array? Because a single huge JSON array requires parsing
the ENTIRE structure before you know it's valid — one malformed document
anywhere in a million-document array could fail the whole batch. Line-by-
line NDJSON lets Elasticsearch (or any consumer) process each document
independently, streaming, without holding the whole payload in memory at
once, and lets one bad line fail without corrupting everything else in
the batch. This is a real, deliberate design choice in how Elasticsearch's
ingestion API works, not an arbitrary quirk.

## Indices are just "which bucket does this belong in," nothing fancier

`logstash.conf` routes `conn_log` records into
`module15-conn-%{+YYYY.MM.dd}` and alerts into
`module15-alerts-%{+YYYY.MM.dd}` — a new index every day, automatically,
via that date pattern. This isn't a special Elasticsearch feature so much
as a naming convention the entire ecosystem has converged on: daily
indices make it trivial to delete old data (drop yesterday's index
entirely rather than deleting individual documents out of one giant
index) and to reason about retention policy in plain terms ("keep 90
days" becomes "keep the 90 most recent daily indices").

## Grafana's panels are just saved queries with a picture attached

Every panel in `grafana_dashboard.json` — the pie chart, the timeseries,
the tables — is fundamentally the same thing: a query against
Elasticsearch (`bucketAggs`/`metrics`, the exact same aggregation
vocabulary Elasticsearch itself uses), rendered as whatever visual shape
you picked. There's no separate "Grafana intelligence" deciding what's
interesting — you're looking at the identical alert documents
`log_shipper.py` wrote, just aggregated and rendered instead of read raw.
Understanding this collapses "learning Grafana" into "learning
Elasticsearch's query/aggregation model, then picking a chart type" —
which is genuinely most of what there is to it.

## Self-test before moving on

- Explain, in your own words, what specifically a SIEM adds on top of
  Module 14's detection scripts — and what it deliberately does NOT add
  (hint: does Elasticsearch itself decide what's suspicious?).
- Why does Elasticsearch's Bulk API use newline-delimited JSON instead of
  one large JSON array?
- Why does splitting data into daily indices (`module15-alerts-2026.07.12`,
  etc.) make data retention/deletion simpler than one single giant index
  holding everything?
