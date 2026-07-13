# Topology 1 — Two PCs, One Switch

The simplest possible topology: no routing at all, pure Layer 2. This is
Module 03's switch simulator, rebuilt with real (simulated) hardware.

## Devices to place

- 1x Switch (any model Packet Tracer offers — 2960 is the standard default)
- 2x PC

## Cabling

- PC0 `FastEthernet0` — Switch `FastEthernet0/1` (Copper Straight-Through —
  Packet Tracer's "Automatically Choose Connection Type" smart cable also
  works and will pick the same one)
- PC1 `FastEthernet0` — Switch `FastEthernet0/2`

## IP addressing

| Device | IP address | Subnet mask |
|---|---|---|
| PC0 | 192.168.1.10 | 255.255.255.0 |
| PC1 | 192.168.1.20 | 255.255.255.0 |

No default gateway needed — both PCs are on the same LAN, so nothing ever
needs to leave this switch.

## Configure each PC

Click the PC → Desktop tab → IP Configuration → enter the IP/subnet mask
above (static, no DHCP).

## Test it

From PC0's Desktop → Command Prompt:
```
ping 192.168.1.20
```

**Expected:** 4 successful replies, all under a few ms (Packet Tracer's
Realtime mode simulates near-instant LAN delivery, not real physical
distance).

## Now switch to Simulation mode and watch it happen

Click the **Simulation** tab (bottom right, next to Realtime). Send the
ping again. Click the tiny colored envelope icon that appears on the
switch, one step at a time (the "Play"/step button). You'll see the exact
sequence Module 03's `switch_sim.py` printed as text:

1. PC0 doesn't know PC1's MAC yet → sends an **ARP request** (broadcast,
   floods out every switch port except the one it came in on)
2. PC1 replies with its MAC (unicast, straight back to PC0's port — the
   switch already learned PC0's MAC from the request it just saw)
3. Click on the packet envelope at any hop — the info window shows OSI
   layers exactly like Module 02's Wireshark capture: Ethernet header at
   the bottom, IP above it, ICMP on top.

This is the payoff of this whole module: everything you did as *text
output* in Modules 02, 03, and 05 is now something you can click through,
one packet at a time, on simulated real Cisco hardware.
