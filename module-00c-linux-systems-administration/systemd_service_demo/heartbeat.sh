#!/usr/bin/env bash
# Module 00c -- a trivial long-running "service": prints a timestamped
# heartbeat every 2 seconds. Its stdout, once run under systemd, is
# automatically captured into the journal -- no explicit log file needed.
while true; do
    echo "heartbeat: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    sleep 2
done
