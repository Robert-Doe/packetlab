# Topology 3 — Three-Router Chain (Module 05, Rebuilt on Real IOS)

This is deliberately the EXACT topology from Module 05's `static_routing.py`
— same addressing, same routers, same expected trace. If you built Module
05 first, you already know what "correct" looks like before you type a
single IOS command here.

```
PC-A ---- R1 ---- R2 ---- R3 ---- Server
   192.0.2.0/24  10.0.12.0/30  10.0.23.0/30  198.51.100.0/24
```

## Devices

- 3x Router (1941)
- 2x Switch
- PC-A, Server (a PC works fine standing in for "Server" in Packet Tracer)

## Cabling

- PC-A — SW1 `Fa0/1`; SW1 `Fa0/2` — R1 `Gi0/0`
- R1 `Gi0/1` — R2 `Gi0/0`
- R2 `Gi0/1` — R3 `Gi0/0`
- R3 `Gi0/1` — SW2 `Fa0/1`; SW2 `Fa0/2` — Server

## IP addressing (identical to Module 05)

| Device | Interface | IP | Prefix |
|---|---|---|---|
| PC-A | — | 192.0.2.10 | /24 (gateway 192.0.2.1) |
| R1 | Gi0/0 | 192.0.2.1 | /24 |
| R1 | Gi0/1 | 10.0.12.1 | /30 |
| R2 | Gi0/0 | 10.0.12.2 | /30 |
| R2 | Gi0/1 | 10.0.23.1 | /30 |
| R3 | Gi0/0 | 10.0.23.2 | /30 |
| R3 | Gi0/1 | 198.51.100.1 | /24 |
| Server | — | 198.51.100.20 | /24 (gateway 198.51.100.1) |

## Configure R1

```
enable
configure terminal
hostname R1
interface GigabitEthernet0/0
 ip address 192.0.2.1 255.255.255.0
 no shutdown
exit
interface GigabitEthernet0/1
 ip address 10.0.12.1 255.255.255.252
 no shutdown
exit
ip route 198.51.100.0 255.255.255.0 10.0.12.2
ip route 0.0.0.0 0.0.0.0 203.0.113.1
end
write memory
```

## Configure R2

```
enable
configure terminal
hostname R2
interface GigabitEthernet0/0
 ip address 10.0.12.2 255.255.255.252
 no shutdown
exit
interface GigabitEthernet0/1
 ip address 10.0.23.1 255.255.255.252
 no shutdown
exit
ip route 192.0.2.0 255.255.255.0 10.0.12.1
ip route 198.51.100.0 255.255.255.0 10.0.23.2
end
write memory
```

## Configure R3

```
enable
configure terminal
hostname R3
interface GigabitEthernet0/0
 ip address 10.0.23.2 255.255.255.252
 no shutdown
exit
interface GigabitEthernet0/1
 ip address 198.51.100.1 255.255.255.0
 no shutdown
exit
ip route 192.0.2.0 255.255.255.0 10.0.23.1
end
write memory
```

## Configure PC-A and Server

Desktop → IP Configuration → static, per the table above.

## Verify against BOTH the validator AND Module 05

```
python topology_validator.py topology_configs/topology3_three_router_chain.json
```

Then, separately:
```
cd ../module-05-routing-fundamentals
python static_routing.py
```

Compare the two outputs' hop sequences for the `PC-A -> 198.51.100.20` and
`Server -> 192.0.2.10` traces — they describe the same topology two
different ways (pure Python simulation vs. JSON-driven validator for a
real Cisco IOS build) and should agree on every hop.

On R1's real CLI, run `traceroute 198.51.100.20` (or `tracert` from PC-A's
Command Prompt) — expect exactly 3 hops (R1 → R2 → R3 → destination),
matching the validator's 3-hop trace precisely.
