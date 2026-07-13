"""
Module 06 -- self-grading tool for Packet Tracer labs.

This course cannot install, launch, or click through Cisco Packet Tracer
for you -- it's a licensed GUI application, not something scriptable in
this environment (see DECISIONS.md). What THIS script does instead: reads
a JSON description of the topology you were told to build (see
topology_configs/*.json), computes the routing table every router SHOULD
show, and traces every test ping hop by hop -- so you have an objective
answer key to check your actual Packet Tracer `show ip route` and `ping`
output against, instead of just hoping you typed the commands right.

Usage:
    python topology_validator.py topology_configs/topology2_two_lans_one_hop.json
    python topology_validator.py topology_configs/topology3_three_router_chain.json
"""
import json
import sys


def ip_to_int(ip: str) -> int:
    o = [int(x) for x in ip.split(".")]
    return (o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]


def int_to_ip(n: int) -> str:
    return ".".join(str((n >> s) & 0xFF) for s in (24, 16, 8, 0))


def prefix_to_mask_int(prefix: int) -> int:
    return 0 if prefix == 0 else (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF


def parse_cidr(cidr: str):
    ip_str, prefix_str = cidr.split("/")
    return ip_str, int(prefix_str)


class Router:
    def __init__(self, name):
        self.name = name
        self.routes = []   # dict: cidr, network_int, prefix, next_hop, iface, connected
        self.own_ips = set()

    def add_connected(self, ip_cidr: str, iface: str):
        ip_str, prefix = parse_cidr(ip_cidr)
        self.own_ips.add(ip_str)
        network_int = ip_to_int(ip_str) & prefix_to_mask_int(prefix)
        self.routes.append({
            "cidr": f"{int_to_ip(network_int)}/{prefix}", "network_int": network_int,
            "prefix": prefix, "next_hop": None, "iface": iface, "connected": True,
        })

    def add_static(self, cidr: str, next_hop: str):
        network_str, prefix = parse_cidr(cidr)
        self.routes.append({
            "cidr": cidr, "network_int": ip_to_int(network_str), "prefix": prefix,
            "next_hop": next_hop, "iface": None, "connected": False,
        })

    def lookup(self, dest_ip: str):
        dest_int = ip_to_int(dest_ip)
        candidates = [
            r for r in self.routes
            if (dest_int & prefix_to_mask_int(r["prefix"])) == (r["network_int"] & prefix_to_mask_int(r["prefix"]))
        ]
        return max(candidates, key=lambda r: r["prefix"]) if candidates else None

    def show_ip_route(self):
        print(f"{self.name}# show ip route")
        for r in sorted(self.routes, key=lambda r: -r["prefix"]):
            if r["connected"]:
                print(f"C    {r['cidr']} is directly connected, {r['iface']}")
            else:
                print(f"S    {r['cidr']} [1/0] via {r['next_hop']}")
        print()


def build_routers(topology: dict):
    routers = {}
    for name, cfg in topology["routers"].items():
        r = Router(name)
        for iface, ip_cidr in cfg["interfaces"].items():
            r.add_connected(ip_cidr, iface)
        for sr in cfg.get("static_routes", []):
            r.add_static(sr["network"], sr["next_hop"])
        routers[name] = r

    ip_owner = {ip: name for name, r in routers.items() for ip in r.own_ips}

    # host default-gateway "routers" are folded in too, so a ping FROM a
    # host can be traced starting at whichever router owns its gateway IP
    host_gateway = {}
    for host, cfg in topology.get("hosts", {}).items():
        host_gateway[host] = cfg["gateway"]

    return routers, ip_owner, host_gateway


def trace_ping(routers, ip_owner, host_gateway, hosts, src_host, dest_ip):
    print(f"{src_host}> ping {dest_ip}")
    gateway_ip = host_gateway[src_host]
    current = ip_owner[gateway_ip]
    hop_count = 0
    visited = set()
    while True:
        if current in visited:
            print("  ROUTING LOOP -- Request timed out.")
            return
        visited.add(current)
        router = routers[current]
        route = router.lookup(dest_ip)
        hop_count += 1
        if route is None:
            print(f"  {current}: no route -- Destination host unreachable.")
            return
        if route["connected"]:
            print(f"  hop {hop_count}: {current} ({route['iface']}) -- delivered to directly connected network")
            approx_rtt_ms = hop_count * 1  # LAN-only hops: Packet Tracer typically shows <1-2ms per hop in Realtime mode
            print(f"  Reply from {dest_ip}: bytes=32 time<{approx_rtt_ms + 1}ms TTL={64 - hop_count}")
            return
        print(f"  hop {hop_count}: {current} -> via {route['next_hop']} ({route['cidr']})")
        next_router = ip_owner.get(route["next_hop"])
        if next_router is None:
            print(f"  hop {hop_count}: {route['next_hop']} is outside this topology -- exits here")
            return
        current = next_router


def main():
    if len(sys.argv) != 2:
        print("Usage: python topology_validator.py <topology.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        topology = json.load(f)

    print(f"Topology: {topology.get('description', sys.argv[1])}\n")

    routers, ip_owner, host_gateway = build_routers(topology)

    print("=" * 70)
    print("Expected `show ip route` output for every router")
    print("=" * 70)
    for r in routers.values():
        r.show_ip_route()

    print("=" * 70)
    print("Expected ping results")
    print("=" * 70)
    for test in topology.get("pings_to_test", []):
        trace_ping(routers, ip_owner, host_gateway, topology.get("hosts", {}), test["from"], test["to"])
        print()


if __name__ == "__main__":
    main()
