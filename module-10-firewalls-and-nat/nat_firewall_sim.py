"""
Module 10 -- NAT (specifically PAT, Port Address Translation) and a
stateful firewall's connection tracking, simulated together, because
that's how they actually run on your real home router: one combined
pipeline, not two separate features.

This directly answers "why can my whole house share ONE public IP" (PAT --
every internal host's connections get the SAME external IP, differentiated
by port) and "why can't something from the internet just reach my laptop
uninvited" (stateful tracking -- inbound traffic is only allowed if it
matches a connection state your own network initiated first).
"""

EXTERNAL_IP = "203.0.113.7"  # your home router's public IP (RFC 5737 example range)


class NatFirewall:
    def __init__(self, external_ip=EXTERNAL_IP):
        self.external_ip = external_ip
        self.next_external_port = 40000
        self.nat_table = {}     # (internal_ip, internal_port) -> external_port
        self.reverse_nat = {}   # (external_ip, external_port) -> (internal_ip, internal_port)
        self.conn_state = {}    # (internal_ip, internal_port, dest_ip, dest_port) -> "NEW" | "ESTABLISHED"

    def outbound(self, internal_ip, internal_port, dest_ip, dest_port):
        """A packet leaving your LAN, headed to the internet."""
        key = (internal_ip, internal_port)
        conn_key = (internal_ip, internal_port, dest_ip, dest_port)

        if key not in self.nat_table:
            ext_port = self.next_external_port
            self.next_external_port += 1
            self.nat_table[key] = ext_port
            self.reverse_nat[(self.external_ip, ext_port)] = key
        else:
            ext_port = self.nat_table[key]

        is_new = conn_key not in self.conn_state
        self.conn_state[conn_key] = "NEW" if is_new else self.conn_state[conn_key]

        print(f"  OUTBOUND {internal_ip}:{internal_port} -> {dest_ip}:{dest_port}")
        print(f"    NAT:      translated source to {self.external_ip}:{ext_port}")
        print(f"    firewall: connection state = {'NEW (creating tracked entry)' if is_new else 'already tracked'}")

        if is_new:
            self.conn_state[conn_key] = "ESTABLISHED"  # the reply we expect will match this
        return self.external_ip, ext_port

    def inbound(self, src_ip, src_port, dest_ip, dest_port):
        """A packet arriving from the internet, addressed to your public IP."""
        print(f"  INBOUND  {src_ip}:{src_port} -> {dest_ip}:{dest_port}")

        nat_key = (dest_ip, dest_port)
        if nat_key not in self.reverse_nat:
            print(f"    NAT:      no entry for {dest_ip}:{dest_port} -- nowhere to translate this to")
            print(f"    firewall: DROPPED -- unsolicited inbound traffic with no matching internal host")
            return None

        internal_ip, internal_port = self.reverse_nat[nat_key]
        conn_key = (internal_ip, internal_port, src_ip, src_port)

        if self.conn_state.get(conn_key) != "ESTABLISHED":
            print(f"    NAT:      would translate to {internal_ip}:{internal_port}, but...")
            print(f"    firewall: DROPPED -- no ESTABLISHED connection state matches this source")
            return None

        print(f"    NAT:      translated destination to {internal_ip}:{internal_port}")
        print(f"    firewall: ALLOWED -- matches ESTABLISHED connection state")
        return internal_ip, internal_port


def main():
    nf = NatFirewall()

    print("=" * 70)
    print("SCENARIO 1: two internal hosts browsing the web -- PAT in action")
    print("=" * 70)
    nf.outbound("192.168.1.10", 51000, "93.184.216.34", 443)
    print()
    nf.outbound("192.168.1.20", 51000, "93.184.216.34", 443)
    print()
    print("  Notice: both internal hosts used the SAME internal port (51000,")
    print("  a coincidence that happens constantly in practice) but got DIFFERENT")
    print(f"  external ports, both behind the one external IP {nf.external_ip}.")
    print("  This is PAT: many internal (ip, port) pairs, one external IP,")
    print("  disambiguated entirely by external port.")

    print()
    print("=" * 70)
    print("SCENARIO 2: the web server's reply comes back -- allowed")
    print("=" * 70)
    nf.inbound("93.184.216.34", 443, nf.external_ip, 40000)

    print()
    print("=" * 70)
    print("SCENARIO 3: a random unsolicited inbound connection -- dropped")
    print("=" * 70)
    nf.inbound("198.51.100.99", 12345, nf.external_ip, 8080)
    print("  Nobody inside your network ever contacted 198.51.100.99, so there's")
    print("  no NAT entry and no connection state for this -- this is why port-")
    print("  scanning a home router from the internet finds almost everything")
    print("  closed: there's no 'server' listening, just a translation table that")
    print("  only has entries for conversations YOUR network started.")

    print()
    print("=" * 70)
    print("SCENARIO 4: an inbound packet claiming an existing port, wrong source")
    print("=" * 70)
    nf.inbound("198.51.100.99", 9999, nf.external_ip, 40000)
    print("  Same external port as Scenario 1's real entry, but from a DIFFERENT")
    print("  source than the one that entry's connection was established with --")
    print("  still dropped. The firewall checks the FULL connection tuple, not")
    print("  just 'is this port open in the NAT table.'")


if __name__ == "__main__":
    main()
