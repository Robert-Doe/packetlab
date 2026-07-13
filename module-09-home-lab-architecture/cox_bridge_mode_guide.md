# Cox Modem Bridge Mode — Production Reconfiguration (Optional, Advanced)

**Read this entire file before touching your Cox equipment.** This
changes how your entire household connects to the internet. Unlike every
other exercise in this course, a mistake here can leave your household
without internet until you fix it or call support. Only do this after
you're comfortable with pfSense/OPNsense in the virtual lab
(`virtual_lab_setup_guide.md`), and only if you actually want your home
network permanently restructured — it is not required to continue this
course.

## Before you start

- **Do this when you don't urgently need working internet** — evenings
  before a deadline, during a video call, etc. are bad times.
- **Write down your current setup first**: log into your Cox gateway's
  admin page (commonly `http://192.168.0.1`, confirmed as your real
  gateway back in Module 01), and note the current Wi-Fi SSID/password,
  any port forwards you rely on, and whether you have a static IP or any
  custom DNS configured.
- **Know how to undo this**: bridge mode is reversible from the same admin
  page (or via the Cox app / calling support) by disabling bridge mode,
  which returns the gateway to its normal all-in-one router/modem
  behavior.
- **Have Cox's support number or chat ready** in case bridge mode doesn't
  take effect cleanly on your specific gateway model — this is a known
  occasional issue with combo modem/router units and isn't something this
  guide can debug remotely for you.

## What bridge mode actually changes

Cox's Panoramic WiFi gateway (and similar combo units) normally does two
jobs at once: it's your cable modem AND your router/firewall/Wi-Fi AP,
all in one box, performing NAT and DHCP for your whole house. **Bridge
mode turns off the router/firewall/Wi-Fi/DHCP half**, leaving only the
modem function — it converts your public IP into an Ethernet signal and
hands it, unmodified, to whatever's plugged into it. Your own
pfSense/OPNsense box then becomes the thing actually doing routing,
firewalling, DHCP, and Wi-Fi (if you also replace the AP) for your house.

## General steps (verify current specifics against Cox's own support site)

Cox's exact menu wording changes over time and by gateway model, so this
is deliberately a description of the PROCESS rather than a click-by-click
script this course can guarantee matches your screen:

1. Log into your Cox gateway's admin page.
2. Find the "Gateway" or "Bridge Mode" section (often under
   Advanced/Network settings).
3. Enable bridge mode. The gateway will likely reboot.
4. Connect your pfSense/OPNsense box's WAN interface to the Cox gateway.
5. pfSense/OPNsense's WAN interface should pick up your public IP via
   DHCP from Cox's network (same as any ISP-facing router would).
6. Configure pfSense/OPNsense's LAN side using the VLAN plan from
   `lab_plan_generator.py`'s output, same as the virtual lab.

## If something goes wrong

Disable bridge mode from the same admin page (you may need a wired
connection directly to the Cox gateway if Wi-Fi was part of what stopped
working). This returns the gateway to normal operation. If the admin page
itself is unreachable, a factory reset of the Cox gateway (physical reset
button, per Cox's documentation for your specific model) restores it to
factory defaults, and you can log in fresh. This is why writing down your
original settings beforehand matters.
