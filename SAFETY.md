# Safety & Scope

This course involves inspecting and, later, actively probing real network
traffic — including on your home network. Read this before running
anything.

## Rules that keep this course legal and safe

1. **Only test devices and networks you own or explicitly control.** Your
   own laptop, your own router (even if it's Cox-leased hardware, the home
   network behind it is yours to test), your own isolated lab VMs. Never
   point scanning, capture, or exploitation tools at neighboring networks,
   public Wi-Fi you don't administer, or Cox's own ISP infrastructure
   (their core routers, DNS servers, etc. are not yours to test).
2. **Servers built for this course bind to `127.0.0.1` by default.** A few
   later modules (home lab architecture, wireless) intentionally involve
   your real LAN — those modules call that out explicitly and explain the
   narrower scope (e.g., "your own AP's SSID only").
3. **Packet capture on a shared network only captures what you're
   authorized to see.** Once you're on a home network with other family
   members' devices, capturing broadcast/multicast traffic incidentally
   includes their traffic too. Treat anything you didn't intend to capture
   as off-limits to inspect — the point of the exercises is your own
   traffic and your own topology, not surveilling housemates.
4. **Vulnerability scanning and exploitation modules (16, parts of 06/09)
   are lab-VM-only.** Never run nmap aggressive scans, Metasploit, or
   similar tools against your live home devices (smart TVs, phones, your
   router's WAN side) — only against deliberately vulnerable VMs
   (Metasploitable, etc.) inside an isolated lab VLAN.
5. **Cox's Acceptable Use Policy** prohibits interfering with or probing
   their network infrastructure. Bridge-mode configuration of your own
   leased modem (Module 09) is normal and supported; scanning or attacking
   anything beyond your own router's LAN side is not.

## What's safe by default

- Introspection tools (Module 01 onward) only read your own machine's
  network configuration — they don't send anything onto the network.
- Any server built for the course binds to `127.0.0.1` unless a module
  explicitly says otherwise and explains the narrower real-network scope.
- Capture exercises are framed around your own traffic (browsing from your
  own machine, pinging your own gateway) rather than passive collection of
  others' traffic.
