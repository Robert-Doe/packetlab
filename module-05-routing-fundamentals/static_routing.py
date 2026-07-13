"""
Module 05 -- static routing tables and longest-prefix-match forwarding,
traced hop by hop across a small 3-router topology:

    PC-A (192.0.2.10) -- R1 -- R2 -- R3 -- Server (198.51.100.20)
                 192.0.2.0/24   10.0.12.0/30   10.0.23.0/30   198.51.100.0/24

Every router's routing table is configured BY HAND in main() -- nothing is
learned dynamically here (that's routing_protocols_sim.py's job). The only
algorithm in this file is longest-prefix match, which is the single rule
every router -- static or dynamic, home or enterprise -- uses to pick which
routing table entry wins when more than one matches a destination.
"""


def ip_to_int(ip: str) -> int:
    o = [int(x) for x in ip.split(".")]
    return (o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]


def prefix_to_mask_int(prefix: int) -> int:
    return 0 if prefix == 0 else (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF


class Router:
    def __init__(self, name):
        self.name = name
        self.routes = []       # each: dict(cidr, network_int, prefix, next_hop, iface, connected)
        self.own_ips = set()   # this router's own interface IPs (for hop-lookup)

    def add_interface(self, ip: str):
        self.own_ips.add(ip)

    def add_connected_route(self, cidr: str, iface: str):
        network_str, prefix = cidr.split("/")
        self.routes.append({
            "cidr": cidr, "network_int": ip_to_int(network_str), "prefix": int(prefix),
            "next_hop": None, "iface": iface, "connected": True,
        })

    def add_static_route(self, cidr: str, next_hop: str, iface: str):
        network_str, prefix = cidr.split("/")
        self.routes.append({
            "cidr": cidr, "network_int": ip_to_int(network_str), "prefix": int(prefix),
            "next_hop": next_hop, "iface": iface, "connected": False,
        })

    def lookup(self, dest_ip: str):
        dest_int = ip_to_int(dest_ip)
        candidates = [
            r for r in self.routes
            if (dest_int & prefix_to_mask_int(r["prefix"])) == (r["network_int"] & prefix_to_mask_int(r["prefix"]))
        ]
        if not candidates:
            return None
        # LONGEST PREFIX MATCH: among everything that matches, the most
        # specific (highest prefix length) route always wins, regardless
        # of how many other, less-specific routes also matched.
        return max(candidates, key=lambda r: r["prefix"])

    def print_table(self):
        print(f"  {self.name} routing table:")
        for r in sorted(self.routes, key=lambda r: -r["prefix"]):
            via = "directly connected" if r["connected"] else f"via {r['next_hop']}"
            print(f"    {r['cidr']:<18} {via:<28} iface {r['iface']}")


def build_topology():
    r1, r2, r3 = Router("R1"), Router("R2"), Router("R3")

    r1.add_interface("192.0.2.1")
    r1.add_interface("10.0.12.1")
    r2.add_interface("10.0.12.2")
    r2.add_interface("10.0.23.1")
    r3.add_interface("10.0.23.2")
    r3.add_interface("198.51.100.1")

    r1.add_connected_route("192.0.2.0/24", "eth0")
    r1.add_connected_route("10.0.12.0/30", "eth1")
    r1.add_static_route("198.51.100.0/24", "10.0.12.2", "eth1")
    r1.add_static_route("0.0.0.0/0", "203.0.113.1", "eth2")  # default route "to the internet"

    r2.add_connected_route("10.0.12.0/30", "eth0")
    r2.add_connected_route("10.0.23.0/30", "eth1")
    r2.add_static_route("192.0.2.0/24", "10.0.12.1", "eth0")
    r2.add_static_route("198.51.100.0/24", "10.0.23.2", "eth1")

    r3.add_connected_route("10.0.23.0/30", "eth0")
    r3.add_connected_route("198.51.100.0/24", "eth1")
    r3.add_static_route("192.0.2.0/24", "10.0.23.1", "eth0")

    routers = {"R1": r1, "R2": r2, "R3": r3}
    ip_owner = {ip: name for name, r in routers.items() for ip in r.own_ips}
    return routers, ip_owner


def trace_packet(routers, ip_owner, start_router: str, dest_ip: str):
    print(f"\nTracing a packet to {dest_ip}, starting at {start_router}:")
    current = start_router
    visited = set()
    while True:
        if current in visited:
            print(f"  ROUTING LOOP detected at {current} -- stopping trace")
            return
        visited.add(current)
        router = routers[current]
        route = router.lookup(dest_ip)
        if route is None:
            print(f"  {current}: no matching route -- packet DROPPED (destination unreachable)")
            return
        print(f"  {current}: longest match is {route['cidr']} ({'connected' if route['connected'] else 'via ' + route['next_hop']})")
        if route["connected"]:
            print(f"  {current}: destination is on a directly connected network -- DELIVERED via {route['iface']}")
            return
        if route["cidr"] == "0.0.0.0/0" and route["next_hop"] not in ip_owner:
            print(f"  {current}: default route -- packet EXITS this topology toward {route['next_hop']} (the wider internet)")
            return
        next_router = ip_owner.get(route["next_hop"])
        if next_router is None:
            print(f"  {current}: next hop {route['next_hop']} is outside this simulated topology -- packet EXITS here")
            return
        current = next_router


def main():
    routers, ip_owner = build_topology()
    for r in routers.values():
        r.print_table()
        print()

    trace_packet(routers, ip_owner, "R1", "198.51.100.20")   # PC-A -> Server, forward path
    trace_packet(routers, ip_owner, "R3", "192.0.2.10")      # Server -> PC-A, return path
    trace_packet(routers, ip_owner, "R1", "8.8.8.8")         # unrelated destination -> default route
    trace_packet(routers, ip_owner, "R2", "203.0.113.55")    # no route anywhere -- R2 has no default route configured


if __name__ == "__main__":
    main()
