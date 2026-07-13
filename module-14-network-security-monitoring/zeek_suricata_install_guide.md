# Installing Real Zeek and Suricata

`conn_log_analyzer.py` and `mini_ids_rules.py` are genuine, working
implementations of the CORE algorithms real Zeek and Suricata use — but
they're not Zeek or Suricata themselves. Both are substantial, mature
open-source projects (primarily Linux-native; Zeek in particular is
awkward on Windows) best installed in your Module 09 virtual lab, not
this course's Windows-based build environment.

## Zeek

```
# Debian/Ubuntu (in your Module 09 lab VM)
sudo apt install zeek

# or build from source / use the official Zeek package repo for your
# distro -- see zeek.org/get-zeek for current instructions
```

Once installed, point it at a capture file (including any .pcap you saved
from Module 02's Wireshark exercises):

```
zeek -r your_capture.pcap
```

This produces real `conn.log`, `dns.log`, `http.log` etc. in your current
directory. Feed the real `conn.log` into this module's own analyzer:

```
python conn_log_analyzer.py conn.log
```

Confirm it correctly reads REAL Zeek output, not just the synthetic data
this module generated for testing.

## Suricata

```
# Debian/Ubuntu
sudo apt install suricata

# Run against a saved capture file with the default ruleset
suricata -r your_capture.pcap -l ./suricata-logs/
```

Check `suricata-logs/fast.log` for any alerts the default community
ruleset triggered. Compare Suricata's real rule syntax (in
`/etc/suricata/rules/`) to `mini_ids_rules.py`'s `DEFAULT_RULES_TEXT` —
you'll recognize the exact same `alert ... (msg:"..."; content:"...";
sid:...;)` structure, because this module's rule format is a genuine
subset of Suricata's real one, not an invented syntax.

## What to actually try, once both are installed

1. Run Suricata against the traffic your OWN Module 07 TCP/UDP echo demos
   generated (capture it first with Wireshark, save as `.pcap`) — confirm
   it produces no alerts (nothing malicious there), then write a custom
   rule matching one of your own echo messages' text and confirm Suricata
   DOES flag it — proving your rule syntax works before trusting more
   complex rules later.
2. Run Zeek against the same capture, inspect `conn.log`, and feed it into
   `conn_log_analyzer.py` — it won't find a port scan or beaconing (your
   echo demos don't produce that traffic pattern), which is itself a
   useful negative-result confirmation that the detectors don't just
   alert on everything.
