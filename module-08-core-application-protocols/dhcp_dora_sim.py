"""
Module 08 -- DHCP's DORA exchange (Discover, Offer, Request, Ack),
simulated in software.

This is DELIBERATELY a simulation, not a real DHCP server bound to a UDP
socket on ports 67/68. A real DHCP server listening on your actual home
network would compete with your router's own DHCP server for every device
that boots up and broadcasts a DHCPDISCOVER -- if your simulated server
answered first, a real device on your network could get handed a bogus
lease and lose connectivity. That's not a hypothetical risk worth taking
for a teaching exercise. See ../SAFETY.md and DECISIONS.md.

Everything below models the real protocol's actual state and message
sequence faithfully -- lease pool exhaustion, conflicting requests, NAKs --
just without ever touching a real network interface.
"""


class DhcpServer:
    def __init__(self, pool_start_last_octet, pool_end_last_octet, subnet_prefix="192.0.2", mask="255.255.255.0", gateway=None, dns=None):
        self.subnet_prefix = subnet_prefix
        self.mask = mask
        self.gateway = gateway or f"{subnet_prefix}.1"
        self.dns = dns or ["68.105.28.11", "68.105.29.11"]
        self.available = [f"{subnet_prefix}.{i}" for i in range(pool_start_last_octet, pool_end_last_octet + 1)]
        self.offered = {}   # mac -> ip (tentatively reserved, not yet confirmed)
        self.leases = {}    # mac -> ip (confirmed)

    def handle_discover(self, mac):
        if mac in self.leases:
            ip = self.leases[mac]
            print(f"    [server] {mac} already has a lease ({ip}) -- offering the same one back")
            self.offered[mac] = ip
            return ip
        if not self.available:
            print(f"    [server] pool EXHAUSTED -- no address to offer {mac}")
            return None
        ip = self.available.pop(0)
        self.offered[mac] = ip
        print(f"    [server] offering {ip} to {mac} (tentatively reserved, not yet leased)")
        return ip

    def handle_request(self, mac, requested_ip):
        offered_ip = self.offered.get(mac)
        if offered_ip != requested_ip:
            print(f"    [server] NAK -- {mac} requested {requested_ip} but was only ever offered {offered_ip}")
            if requested_ip and requested_ip not in self.leases.values() and requested_ip in self.available:
                self.available.remove(requested_ip)
            return None
        self.leases[mac] = requested_ip
        print(f"    [server] ACK -- {mac} leased {requested_ip}")
        return {
            "ip": requested_ip, "mask": self.mask, "gateway": self.gateway, "dns": self.dns,
        }

    def release(self, mac):
        ip = self.leases.pop(mac, None)
        if ip:
            self.available.append(ip)
            print(f"    [server] {mac} released {ip} -- returned to the pool")


class DhcpClient:
    def __init__(self, mac):
        self.mac = mac
        self.lease = None

    def acquire(self, server: DhcpServer):
        print(f"{self.mac}: broadcasting DHCPDISCOVER (\"is anyone out there with an address for me?\")")
        offered_ip = server.handle_discover(self.mac)
        if offered_ip is None:
            print(f"{self.mac}: no DHCPOFFER received -- staying unconfigured (this is what 169.254.x.x APIPA addresses mean in real life)")
            return None

        print(f"{self.mac}: received DHCPOFFER of {offered_ip} -- broadcasting DHCPREQUEST to claim it")
        result = server.handle_request(self.mac, offered_ip)
        if result is None:
            print(f"{self.mac}: received DHCPNAK -- restarting the DORA process would happen here in real DHCP")
            return None

        print(f"{self.mac}: received DHCPACK -- configuring interface with {result}")
        self.lease = result
        return result


def main():
    server = DhcpServer(pool_start_last_octet=100, pool_end_last_octet=102)  # only 3 addresses on purpose

    print("=" * 70)
    print("Two clients acquiring leases normally")
    print("=" * 70)
    client_a = DhcpClient("aa:bb:cc:00:00:01")
    client_a.acquire(server)
    print()
    client_b = DhcpClient("aa:bb:cc:00:00:02")
    client_b.acquire(server)

    print()
    print("=" * 70)
    print("A client re-requesting its EXISTING lease (e.g. after a reboot)")
    print("=" * 70)
    client_a.acquire(server)

    print()
    print("=" * 70)
    print("Pool exhaustion -- only 1 address left, then none")
    print("=" * 70)
    client_c = DhcpClient("aa:bb:cc:00:00:03")
    client_c.acquire(server)
    print()
    client_d = DhcpClient("aa:bb:cc:00:00:04")
    client_d.acquire(server)  # pool is now empty -- expect no offer

    print()
    print("=" * 70)
    print("Releasing a lease frees the address for reuse")
    print("=" * 70)
    server.release(client_b.mac)
    client_e = DhcpClient("aa:bb:cc:00:00:05")
    client_e.acquire(server)  # should get client_b's old address back


if __name__ == "__main__":
    main()
