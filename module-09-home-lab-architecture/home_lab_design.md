# Home Lab Design — Planning Before Touching Anything

This module is different from Modules 01-08: everything before this point
ran in a sandbox where a mistake cost you nothing but a restart. From here
on, some exercises touch your real home network and real production
internet connection. Read this whole file before changing anything.

## The two paths, and which one to take first

There are two ways to get real firewall/VLAN/routing experience:

1. **Virtual lab (start here):** run pfSense/OPNsense as a virtual machine
   on your existing computer, with virtual network interfaces, never
   touching your real Cox modem or real internet path at all. Zero risk to
   your household's internet access. This is `virtual_lab_setup_guide.md`.
2. **Production reconfiguration (later, optional):** put your Cox modem
   into bridge mode and run a real router/firewall as your household's
   actual gateway. This changes how your whole house gets online. This is
   `cox_bridge_mode_guide.md`, and it comes with real risk: if misconfigured,
   your household loses internet until you fix it or revert.

**Do the virtual lab first.** Everything about pfSense's interface, VLAN
configuration, and firewall rules is identical whether it's running
virtually or as your real gateway — there is no learning you'd skip by
starting virtual. The only thing production reconfiguration adds is "this
now matters if I get it wrong," which is not a good thing to add before
you're fluent.

## What a segmented home lab actually looks like

A reasonable target architecture, building on Module 04's VLSM work:

```
Internet
   |
[Cox modem, bridge mode]
   |
[pfSense/OPNsense router-firewall]
   |
   +---- VLAN 10 (Main)      -- your trusted personal devices
   +---- VLAN 20 (IoT/Guest) -- smart TVs, guest Wi-Fi, anything you don't
   |                            fully trust
   +---- VLAN 30 (Lab)       -- this course's future modules (monitoring,
                                 vulnerable VMs, anything you'd rather
                                 firewall away from your main devices)
```

The firewall rules that matter most, conceptually:
- VLAN 10 can reach VLAN 30 (you administering your own lab)
- VLAN 30 cannot initiate connections to VLAN 10 (a compromised lab VM
  shouldn't be able to reach your personal devices)
- VLAN 20 can reach the internet but not VLAN 10 or VLAN 30 at all (a
  compromised smart bulb shouldn't be able to reach anything sensitive)

This is the same VLAN-isolation mechanism Module 03's `switch_sim.py`
demonstrated in software — a home router/firewall like pfSense just adds
actual rule enforcement (Module 03's simulated switch only isolated
broadcast domains; a firewall additionally decides which VLANs can
initiate traffic to which other VLANs at all).

## Run `lab_plan_generator.py` before deciding on real numbers

Rather than guessing subnet sizes, use this module's generator script
(tested, working) to turn your real home subnet (from Module 01) into a
concrete 3-VLAN plan sized to how many devices you actually have. See
tutorial.html Step 1.
