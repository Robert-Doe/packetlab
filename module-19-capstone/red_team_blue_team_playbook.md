# Red Team / Blue Team Playbook — Your Own Lab Only

Every action in this playbook is scoped to your own isolated Module 09 lab
VLAN, against VMs you own and control. See `../SAFETY.md`. This is a
structured self-exercise, not a competitive CTF against another person's
infrastructure.

## Round 1 — Red: cause an incident

Pick ONE of these (or design your own, similarly scoped):

- Use Module 16's `tcp_connect_scanner.py`, modified to accept your lab's
  real subnet (not just localhost — this is the one place in the whole
  course where relaxing that restriction is appropriate, because you're
  now working against your OWN authorized lab), to scan a Metasploitable
  VM.
- Exploit the vsftpd 2.3.4 backdoor (CVE-2011-2523) on Metasploitable —
  research the actual exploitation steps (the trigger is a smiley-face
  string in a username, as Module 16 and 18 both referenced) and confirm
  you get a shell.
- Simulate exfiltration: from a compromised lab VM, send a large,
  unusual-looking transfer to a host outside your lab VLAN (another VM you
  control, standing in for "the attacker's server").

Capture your own traffic with Wireshark the entire time (Module 02/14
technique).

## Round 2 — Blue: detect it

Without looking at your Round 1 notes, feed your captured traffic into
your monitoring pipeline (Module 14's `conn_log_analyzer.py`/real
Zeek+Suricata from your lab, and Module 15's SIEM if you built it).

- Did your port-scan detector fire?
- Did your vulnerability scan (Module 16) already have this CVE in its
  database, ahead of time?
- Did anything in your SIEM dashboard surface the exfiltration pattern?

**If nothing fired:** that's a real, valuable finding. Write down exactly
what your monitoring missed and why — this is genuinely how real detection
engineering improves over time.

## Round 3 — Forensics: reconstruct it from evidence alone

Using ONLY your Wireshark capture (not your memory of what you did in
Round 1), write an incident timeline using Module 18's approach
(`pcap_reader.py`/`incident_timeline.py`, adapted to your real capture).

- Does your reconstructed timeline match what you actually did?
- Where does it diverge, and why? (Missing evidence? A detection blind
  spot? A misread payload?)

## Round 4 — Remediate

For whatever vulnerability Round 1 exploited:

- Apply the actual fix (patch the vsftpd version, close the exposed port,
  add the missing firewall rule — whatever's appropriate to what you did).
- Re-run Round 1's exact attack again.
- Confirm it now fails.
- Update your capstone manifest's vulnerability findings to
  `"remediated": true` — and mean it, because you just verified it.

## Round 5 — Write it up

Use `final_report_template.md`. This is the actual deliverable a real
incident responder produces — everything before this round was gathering
the evidence this report presents.
