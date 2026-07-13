# packetlab

**A from-scratch-to-expert networking curriculum, taught against a network you actually own.**

Most networking courses hand you a diagram and ask you to memorize it. packetlab hands you a
home lab — your own router, your own Wi-Fi, your own isolated VMs — and asks you to instrument
it, break it, and rebuild it, one mechanism at a time. Every module ships working code (Python
*and* JavaScript/Node side by side) that introspects, simulates, or actively drives a piece of
the stack, plus four tiers of written material so the same concept gets explained at four
different depths before you move on.

## Why this exists

Reading that a switch "learns MAC addresses by inspecting source addresses" is not the same as
watching your own `switch_sim.py` populate a forwarding table from real frames. packetlab is
built on the belief that networking concepts that stay abstract don't stick — so nearly every
module pairs a written explanation with a program you run against real (or realistically
simulated) traffic, and the harder or more sensitive modules (wireless handshakes, vulnerability
scanning, firewall/NAT) are explicitly scoped to a home lab you control, never someone else's
network. See [SAFETY.md](SAFETY.md) for the exact rules this course operates under before running
anything against your live network.

## How each module is packaged

Every module folder follows the same five-piece structure:

- **`headfirst.md`** — the concept explained loud and repetitive on purpose, with "brain power"
  self-test call-outs. Read this first.
- **`tutorial.html`** — the walkthrough: run this, expect this output, then extend it against your
  own network.
- **`tutorial2.html`** — deep theory: the textbook-depth *why*, not just the mechanism — written to
  the standard of a PhD comprehensive-exam committee's expectations.
- **`tutorial3.html`** — exam practice: comprehensive-exam-style Q&A with full, collapsible model
  answers for genuine self-testing.
- **`tutorial4.html`** — the complete mastery guide: every concept rebuilt from zero background,
  fully worked numeric scenarios, line-by-line code walkthroughs.
- **`DECISIONS.md`** — why the lab code for that module is built the way it is.
- Working code in both **Python and JavaScript/Node** wherever the concept supports it, launched
  with a one-command `run.bat` / `Makefile`.

## Course map

### Tier 0 — Prerequisites

| # | Module | Theme |
|---|--------|-------|
| 00a | [Discrete Math & Number Systems](module-00a-discrete-math-number-systems/) | Binary/hex from scratch, boolean logic, modular arithmetic, a real toy Diffie-Hellman exchange |
| 00b | [C for Protocol Internals & Buffer Bugs](module-00b-c-for-protocol-internals/) | Packed structs, pointers, byte order, an observed buffer overflow (two ways) |
| 00c | [Linux Systems Administration](module-00c-linux-systems-administration/) | Filesystem/permissions as boolean algebra, a real systemd service lifecycle, safe package management |

### Core — 19 modules

| # | Module | Theme |
|---|--------|-------|
| 01 | [Environment & Lab Foundations](module-01-environment-lab-foundations/) | Tooling, first network introspection, Python + JS variants |
| 02 | [OSI & TCP/IP Model, For Real](module-02-osi-tcpip-model/) | Capture your own traffic, map every frame to a layer |
| 03 | [Data Link Layer](module-03-datalink-switching-arp/) | Switch MAC learning, VLAN tagging, ARP mechanics in an isolated lab |
| 04 | [IP Addressing & Subnetting](module-04-ip-addressing-subnetting/) | Subnetting as bitwise AND, build your own subnet calculator |
| 05 | [Routing Fundamentals](module-05-routing-fundamentals/) | Longest-prefix match, static routes, RIP/OSPF basics in a simulated topology |
| 06 | [Packet Tracer Mastery](module-06-packet-tracer-mastery/) | Build topologies, watch real switch/router algorithms animate packet-by-packet |
| 07 | [Transport Layer — TCP/UDP Internals](module-07-transport-layer/) | Raw socket programming, TCP state machine byte-by-byte |
| 08 | [Core Application Protocols](module-08-core-application-protocols/) | Stand up your own DNS, DHCP, HTTP server |
| 09 | [Home Lab Architecture](module-09-home-lab-architecture/) | Trust boundaries as VLAN segmentation, bridge mode, pfSense/OPNsense |
| 10 | [Firewalls & NAT](module-10-firewalls-and-nat/) | Stateful firewalls as a memory problem, NAT/PAT traced packet-by-packet |
| 11 | [VPN Technologies](module-11-vpn-technologies/) | Encapsulation, a real WireGuard tunnel between your own machines |
| 12 | [Wireless Networking (802.11)](module-12-wireless-networking/) | Frame analysis, WPA2/3 4-way handshake — your own AP only |
| 13 | [Applied Cryptography for Networking](module-13-applied-cryptography/) | TLS handshake dissection, toy PKI, certificate chain verification |
| 14 | [Network Security Monitoring](module-14-network-security-monitoring/) | Detection as statistics: Wireshark, Zeek, Suricata on your own lab traffic |
| 15 | [SIEM / Home SOC Build](module-15-siem-home-soc/) | ELK + Grafana pipeline fed by your own lab's logs |
| 16 | [Vulnerability Assessment](module-16-vulnerability-assessment/) | nmap, banner grabbing, OpenVAS — isolated lab VMs only |
| 17 | [Cloud Networking](module-17-cloud-networking/) | VPCs, security groups as identity-aware firewalls, load balancers on free-tier cloud |
| 18 | [Network Forensics & Incident Response](module-18-network-forensics/) | Hand-roll a pcap writer/reader, reconstruct a session, timeline an intrusion |
| 19 | [Capstone — Design, Build, Attack & Defend](module-19-capstone/) | A full segmented home-lab network, red-team/blue-team it yourself |

### Extended — forensics, malware, and research

| # | Module | Theme |
|---|--------|-------|
| 20 | [Malware Analysis & Reverse Engineering](module-20-malware-analysis-reverse-engineering/) | Static/dynamic analysis of a real benign binary: strings, objdump, XOR deobfuscation, anti-debugging |
| 21 | [Research Methodology & CTF Practice](module-21-research-methodology-ctf-practice/) | A solvable CTF reversing challenge, literature-review structure, coordinated disclosure ethics |

## Tech stack

- **Python 3** and **Node.js** — parallel implementations of nearly every lab exercise
- **C** (Module 00b) — compiled, unsafe-by-default protocol internals and buffer-overflow demos
- **Bash / shell** (Module 00c) — Linux systems administration exercises
- **Cisco Packet Tracer** (Module 06) — topology simulation
- **WireGuard, pfSense/OPNsense** — real VPN and home-router configuration
- **Wireshark, Zeek, Suricata** — traffic capture and network security monitoring
- **Elasticsearch, Kibana, Grafana** — the home-SOC log pipeline (Module 15)
- **Terraform** — cloud networking exercises (Module 17)
- **Ghidra / objdump / xxd** — reverse-engineering toolchain (Module 20)

## Status

Complete: all 24 modules (00a–00c, 01–21). Every module has working, tested code, the original
`headfirst.md` / `tutorial.html` / `DECISIONS.md` set, the `tutorial2.html` (deep theory) +
`tutorial3.html` (exam Q&A) pair, and a `tutorial4.html` complete mastery guide.

## How to run

Each module is self-contained:

```bash
cd module-01-environment-lab-foundations
# Python variant
pip install -r requirements.txt
python netinfo_server.py
# or Node variant / one-shot launcher
./run.bat        # Windows
make             # if a Makefile is present
```

Start with `headfirst.md` in each module, then `tutorial.html`, then run the code. `tutorial2.html`
through `tutorial4.html` are there once you want to go deeper than the base build. Read
[SAFETY.md](SAFETY.md) in full before Module 09 (home lab architecture), Module 12 (wireless), or
Module 16 (vulnerability assessment) — those modules intentionally touch your real network or run
active scanning tools, and SAFETY.md defines exactly what's in scope.
