# Design Decisions — Module 15

## Why the ELK+Grafana stack wasn't brought up during this module's build

Standing up a 4-container stack (Elasticsearch alone typically wants
512MB+ of memory) is a genuine, non-trivial resource commitment on a
student's machine -- the kind of action this course's own guidelines treat
as worth a deliberate choice rather than a side effect of following a
tutorial. The student was asked directly during this module's build
whether to bring the stack up and test it live, or build tested
tooling/config and let the student choose when to run it; the untested,
guide-based path was chosen. Everything that COULD be verified without the
daemon running was verified: `docker-compose.yml`'s syntax (via
`docker compose config`, which doesn't require a running daemon),
`log_shipper.py`/`.js`'s output format (fully tested, including
self-validation of the Bulk API NDJSON structure), and
`grafana_dashboard.json`'s JSON well-formedness.

## Why xpack.security.enabled=false in the Elasticsearch config

Elasticsearch's security features (authentication, TLS between nodes) are
essential for any multi-node or internet-facing deployment, but add real
friction (certificate setup, credential management) for a single-node,
127.0.0.1-only home lab whose entire threat model is "nothing outside my
own machine can reach this at all." The compose file's port bindings
(`127.0.0.1:9200`, etc.) already ensure nothing external can reach these
services regardless of the security setting -- disabling xpack security
here trades a real hardening feature for lab simplicity, deliberately, and
the file comments say so explicitly rather than leaving it as a silent
security-relevant default a student might copy into a different context
without realizing the tradeoff.

## Why log_shipper.py doesn't import Module 14's actual detector functions

Every module in this course is self-contained -- its own directory, its
own files, no cross-module import dependencies -- so that a student
working through modules out of order, or examining one module's code in
isolation, never hits a missing dependency on a sibling directory.
`log_shipper.py` demonstrates the REAL transformation logic (alert dict ->
Logstash JSON / Elasticsearch Bulk API format) against representative
sample data shaped exactly like Module 14's real output, and Exercise 1
explicitly asks the student to wire in a real cross-module import
themselves -- a reasonable exercise, but not this module's own default
structure.

## Why both a Logstash pipeline AND a direct Bulk API path are provided

`logstash.conf` represents the "real" production-shaped pipeline (a
dedicated ingestion tool parsing and transforming data before it reaches
storage) that also directly demonstrates Module 14's Zeek-format
`conn.log` being consumed by real Elastic tooling. `write_bulk_ndjson()`
represents the more minimal, direct path (skip Logstash, POST straight to
Elasticsearch's own API) that's genuinely useful for smaller, simpler
pipelines and is worth understanding as a distinct, valid option rather
than treating Logstash as the only way data ever reaches Elasticsearch.

## Why Grafana's dashboard JSON was validated only structurally, not against a live Grafana instance

Confirming a dashboard JSON export ACTUALLY renders correctly requires a
running Grafana instance connected to a populated Elasticsearch data
source -- exactly the live-stack testing this module's build deliberately
deferred to the student (see the first entry above). What was verified:
the file is well-formed JSON and follows Grafana's documented dashboard
schema shape (panels array, each with id/title/type/gridPos/targets) as
of Grafana's current dashboard JSON model. Step 4 of the tutorial frames
importing it as something to confirm yourself, honestly, rather than
this document overclaiming a rendering result that wasn't actually observed.
