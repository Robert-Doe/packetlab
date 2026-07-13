# Topology 2 — Two LANs, One Router Hop

Matches `topology2_two_lans_one_hop.json` exactly — build this, configure
it, then run the validator against that JSON file and compare line by line.

## Devices to place

- 2x Router (1941 is Packet Tracer's standard default ISR)
- 2x Switch
- 2x PC

## Cabling

- PC-A `FastEthernet0` — SW1 `FastEthernet0/1`
- SW1 `FastEthernet0/2` — R1 `GigabitEthernet0/0`
- R1 `GigabitEthernet0/1` — R2 `GigabitEthernet0/1` (Copper Straight-Through
  — router-to-router in Packet Tracer typically uses a Serial DCE/DTE pair
  in real course material, but a direct GigabitEthernet link is simpler and
  equally valid for this exercise; if your instructor requires Serial links,
  the IOS commands below are identical except the interface name)
- R2 `GigabitEthernet0/0` — SW2 `FastEthernet0/1`
- SW2 `FastEthernet0/2` — PC-B `FastEthernet0`

## IP addressing

| Device | Interface | IP address | Prefix |
|---|---|---|---|
| PC-A | — | 192.168.10.10 | /24 (gateway 192.168.10.1) |
| R1 | Gi0/0 | 192.168.10.1 | /24 |
| R1 | Gi0/1 | 10.0.1.1 | /30 |
| R2 | Gi0/1 | 10.0.1.2 | /30 |
| R2 | Gi0/0 | 192.168.20.1 | /24 |
| PC-B | — | 192.168.20.10 | /24 (gateway 192.168.20.1) |

## Configure R1 (CLI tab, in the router's config prompt)

```
enable
configure terminal
hostname R1
interface GigabitEthernet0/0
 ip address 192.168.10.1 255.255.255.0
 no shutdown
exit
interface GigabitEthernet0/1
 ip address 10.0.1.1 255.255.255.252
 no shutdown
exit
ip route 192.168.20.0 255.255.255.0 10.0.1.2
end
write memory
```

## Configure R2

```
enable
configure terminal
hostname R2
interface GigabitEthernet0/1
 ip address 10.0.1.2 255.255.255.252
 no shutdown
exit
interface GigabitEthernet0/0
 ip address 192.168.20.1 255.255.255.0
 no shutdown
exit
ip route 192.168.10.0 255.255.255.0 10.0.1.1
end
write memory
```

## Configure both PCs

Desktop → IP Configuration → static IP/mask/gateway per the table above.

## Verify against the validator

```
cd module-06-packet-tracer-mastery
python topology_validator.py topology_configs/topology2_two_lans_one_hop.json
```

On R1's CLI, run `show ip route` and compare every line to the validator's
`R1# show ip route` section. On PC-A's Command Prompt, run
`ping 192.168.20.10` and compare to the validator's traced hops.

**If they don't match:** you have a real configuration error, not a
theoretical one. Common causes: forgot `no shutdown` on an interface (it
stays administratively down forever until you do), wrong subnet mask
(`255.255.255.252` vs `255.255.255.0` typo), or the static route's next-hop
IP doesn't match what you actually configured on the far router's
interface.
