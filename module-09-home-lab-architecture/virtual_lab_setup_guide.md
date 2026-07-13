# Virtual Lab Setup — pfSense/OPNsense in a VM

This is the recommended starting point (see `home_lab_design.md`). Nothing
here touches your real Cox modem, your real router, or your household's
actual internet path. Everything runs inside virtual machines on your
existing computer.

## What you need

- A hypervisor: VirtualBox (free) or VMware Workstation Player (free for
  personal use). Either works; instructions below use VirtualBox terms
  ("Internal Network"), but OPNsense/pfSense don't care which hypervisor
  hosts them.
- The pfSense or OPNsense installer ISO, downloaded directly from
  `pfsense.org` or `opnsense.org` — both are free, open-source firewall
  distributions. This course does not download it for you; get it from
  the project's own official site.
- At least 2 GB RAM and 8 GB disk free for the firewall VM, plus whatever
  a "client" VM (a small Linux distro works fine) needs.

## Network layout inside the hypervisor

Create three virtual networks in your hypervisor's network manager:
1. **WAN (NAT network)** — gives the firewall VM internet access via your
   host machine's own connection, standing in for "the Cox modem" without
   touching it at all.
2. **LAN-internal-1** ("Internal Network" in VirtualBox terms) — an
   isolated virtual network with no host connectivity, representing
   VLAN 10 (Main).
3. **LAN-internal-2** — a second isolated virtual network, representing
   VLAN 20 (IoT/Guest) or VLAN 30 (Lab) depending which you build first.

## Install pfSense/OPNsense

1. Create a new VM, attach the installer ISO, boot it.
2. Give the VM 3 virtual network adapters: adapter 1 → WAN (NAT), adapter
   2 → LAN-internal-1, adapter 3 → LAN-internal-2.
3. Follow the installer's prompts (defaults are fine for a first lab).
4. On first boot, the console menu lets you assign which virtual NIC is
   WAN vs LAN1 vs LAN2 — match them to what you attached in step 2.
5. Once assigned, the console shows a URL (usually
   `https://192.168.1.1` or similar on the LAN1 interface) — that's the
   web admin GUI.

## Create a client VM to test from

Create a second, small VM (any lightweight Linux distro, or even just
another virtual NIC on an existing VM) attached ONLY to LAN-internal-1.
It should get a DHCP lease from pfSense/OPNsense automatically (both ship
with DHCP enabled on LAN by default) and be able to reach the internet
through the firewall's WAN/NAT path.

## What to actually configure, matching this course's earlier modules

- **Interfaces → assign VLANs** on LAN2 the way Module 03 modeled — give
  it its own subnet from `lab_plan_generator.py`'s output.
- **Firewall → Rules** — write a rule blocking LAN2 (Lab) from initiating
  connections to LAN1 (Main), matching `home_lab_design.md`'s isolation
  goal. Confirm it works by trying to ping LAN1's client VM from a LAN2
  client VM (should fail) and the reverse (should succeed, if you allow it).
- **Diagnostics → Routes** — compare what you see here to Module 05's
  `show ip route`-style output; the concept (longest-prefix match routing
  table) is identical, just a different vendor's UI.

## Once you're comfortable here

Only after the virtual lab's isolation rules work exactly as intended
should you consider `cox_bridge_mode_guide.md`'s production path — and even
then, treat it as optional. A fully virtual lab teaches everything this
course needs; production reconfiguration is for students who specifically
want their home network itself restructured, not a requirement to
continue to Module 10.
