"""
Module 15 -- converts security findings (the shape Module 14's
conn_log_analyzer.py and mini_ids_rules.py produce) into two real,
standard formats a SIEM pipeline actually consumes:

  1. alerts.jsonl -- one JSON object per line, matching what this
     module's logstash.conf is configured to read via its `json_lines`
     codec.
  2. Elasticsearch's actual Bulk API NDJSON format (an "action" line
     followed by a "source" line, repeated) -- the real wire format
     `POST /_bulk` expects, so this module's output could be piped
     directly into a running Elasticsearch with `curl -H 'Content-Type:
     application/x-ndjson' --data-binary @bulk.ndjson
     localhost:9200/_bulk` once Docker is up (see tutorial.html).

This file only transforms data -- it never requires Elasticsearch,
Logstash, or Docker to be running to test that the OUTPUT format is
correct, which is exactly what main()'s self-test below verifies.
"""
import json
from datetime import datetime, timezone


def alert_to_document(alert: dict) -> dict:
    """Normalizes one of Module 14's finding dicts into a flat document
    with an ISO8601 timestamp, ready for Logstash's `date` filter."""
    doc = dict(alert)  # copy, don't mutate the caller's dict
    doc["timestamp"] = datetime.now(timezone.utc).isoformat()
    doc["source_module"] = "module-14-network-security-monitoring"
    return doc


def write_jsonl(alerts: list, path="alerts.jsonl"):
    with open(path, "w") as f:
        for alert in alerts:
            f.write(json.dumps(alert_to_document(alert)) + "\n")
    return path


def write_bulk_ndjson(alerts: list, index_name="module15-alerts", path="bulk.ndjson"):
    """Real Elasticsearch Bulk API format: an action-and-metadata line,
    then a source line, repeated for every document, each JSON-encoded on
    its own line with NO enclosing array or commas -- this is a real
    format quirk (newline-delimited JSON, not a JSON array) that trips up
    anyone hand-rolling their first bulk request."""
    lines = []
    for alert in alerts:
        action = {"index": {"_index": index_name}}
        lines.append(json.dumps(action))
        lines.append(json.dumps(alert_to_document(alert)))
    content = "\n".join(lines) + "\n"  # bulk API requires a trailing newline
    with open(path, "w") as f:
        f.write(content)
    return path


def validate_bulk_ndjson(path: str) -> bool:
    """Confirms a bulk.ndjson file is well-formed: alternating action/source
    lines, each independently valid JSON, even without Elasticsearch running
    to actually accept it."""
    with open(path) as f:
        lines = [line for line in f.read().split("\n") if line]

    if len(lines) % 2 != 0:
        raise ValueError("bulk file must have an even number of lines (action + source pairs)")

    for i in range(0, len(lines), 2):
        action = json.loads(lines[i])  # raises if not valid JSON
        source = json.loads(lines[i + 1])
        if "index" not in action and "create" not in action:
            raise ValueError(f"line {i}: expected an 'index' or 'create' action, got {action}")
    return True


SAMPLE_ALERTS = [
    {"type": "port_scan", "src": "192.168.1.30", "dst": "192.168.1.99",
     "distinct_ports": 40, "window_seconds": 10},
    {"type": "beaconing", "src": "192.168.1.10", "dst": "203.0.113.66", "port": 443,
     "occurrences": 12, "mean_interval_s": 59.87, "jitter_ratio": 0.02},
    {"type": "ids_signature", "sid": "1000001", "msg": "Possible SQL injection attempt",
     "src": "192.168.1.45", "dst": "10.0.0.5"},
]


def main():
    jsonl_path = write_jsonl(SAMPLE_ALERTS)
    print(f"Wrote {jsonl_path} ({len(SAMPLE_ALERTS)} documents, Logstash json_lines format)")
    with open(jsonl_path) as f:
        print(f"  first line: {f.readline().strip()}")

    bulk_path = write_bulk_ndjson(SAMPLE_ALERTS)
    print(f"\nWrote {bulk_path} (Elasticsearch Bulk API NDJSON format)")
    ok = validate_bulk_ndjson(bulk_path)
    print(f"  Self-validation (well-formed action/source pairs): {ok}")
    with open(bulk_path) as f:
        lines = f.read().splitlines()
    print(f"  {len(lines)} lines total ({len(lines) // 2} action/source pairs)")
    print(f"  line 0 (action): {lines[0]}")
    print(f"  line 1 (source): {lines[1]}")


if __name__ == "__main__":
    main()
