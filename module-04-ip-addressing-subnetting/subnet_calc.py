"""
Module 04 -- a subnet calculator built entirely from 32-bit integer
arithmetic. No `ipaddress` module import in the actual logic -- the whole
point is that you should be able to derive network address, broadcast
address, and usable host range from nothing but bit shifts and masks,
because that's genuinely all a subnet mask ever does.

(Python's `ipaddress` module IS used, but only in `_self_test()` at the
bottom, to cross-check this file's manual math against the standard
library on hundreds of random cases -- a correctness check, not a
shortcut for the real implementation.)
"""
import random
import sys


def ip_to_int(ip: str) -> int:
    octets = [int(o) for o in ip.split(".")]
    if len(octets) != 4 or any(not (0 <= o <= 255) for o in octets):
        raise ValueError(f"not a valid IPv4 address: {ip!r}")
    return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]


def int_to_ip(n: int) -> str:
    return ".".join(str((n >> shift) & 0xFF) for shift in (24, 16, 8, 0))


def prefix_to_mask_int(prefix: int) -> int:
    if not (0 <= prefix <= 32):
        raise ValueError(f"prefix must be 0-32, got {prefix}")
    if prefix == 0:
        return 0
    return (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF


def parse_cidr(cidr: str):
    ip_str, prefix_str = cidr.split("/")
    return ip_to_int(ip_str), int(prefix_str)


def subnet_info(cidr: str) -> dict:
    ip_int, prefix = parse_cidr(cidr)
    mask_int = prefix_to_mask_int(prefix)
    wildcard_int = (~mask_int) & 0xFFFFFFFF

    network_int = ip_int & mask_int
    broadcast_int = network_int | wildcard_int
    total_addresses = 1 << (32 - prefix)

    if prefix == 32:
        usable_hosts = 1
        first_host, last_host = network_int, network_int
    elif prefix == 31:
        # RFC 3021: both addresses usable on a point-to-point link
        usable_hosts = 2
        first_host, last_host = network_int, broadcast_int
    else:
        usable_hosts = total_addresses - 2
        first_host, last_host = network_int + 1, broadcast_int - 1

    return {
        "input": cidr,
        "prefix": prefix,
        "netmask": int_to_ip(mask_int),
        "wildcard_mask": int_to_ip(wildcard_int),
        "network": int_to_ip(network_int),
        "broadcast": int_to_ip(broadcast_int),
        "first_host": int_to_ip(first_host),
        "last_host": int_to_ip(last_host),
        "total_addresses": total_addresses,
        "usable_hosts": usable_hosts,
    }


def print_info(cidr: str):
    info = subnet_info(cidr)
    print(f"Input:            {info['input']}")
    print(f"Netmask:          {info['netmask']}  (/{info['prefix']})")
    print(f"Wildcard mask:    {info['wildcard_mask']}")
    print(f"Network address:  {info['network']}")
    print(f"Broadcast address:{info['broadcast']}")
    print(f"Usable host range:{info['first_host']} - {info['last_host']}")
    print(f"Total addresses:  {info['total_addresses']}")
    print(f"Usable hosts:     {info['usable_hosts']}")


# ------------------------------------------------------------------ VLSM --
def vlsm_allocate(base_cidr: str, host_requirements: list) -> list:
    """
    Classic VLSM: given a base network and a list of (name, hosts_needed)
    requirements, allocate the SMALLEST subnet that satisfies each
    requirement, largest requirement first, packed contiguously from the
    start of the base network. Returns a list of dicts, one per allocation,
    or raises ValueError if the base network is too small.
    """
    base_ip_int, base_prefix = parse_cidr(base_cidr)
    base_network_int = base_ip_int & prefix_to_mask_int(base_prefix)
    base_size = 1 << (32 - base_prefix)

    # Largest requirement first is the standard VLSM packing strategy --
    # it minimizes wasted addresses versus allocating in submission order.
    sorted_reqs = sorted(host_requirements, key=lambda r: r[1], reverse=True)

    allocations = []
    cursor = base_network_int
    end = base_network_int + base_size

    for name, hosts_needed in sorted_reqs:
        # find smallest prefix whose usable-hosts count covers hosts_needed
        needed_addresses = hosts_needed + 2  # + network + broadcast
        prefix = 32
        while (1 << (32 - prefix)) < needed_addresses:
            prefix -= 1
        block_size = 1 << (32 - prefix)

        # align cursor up to a multiple of block_size (subnets must start
        # on a boundary divisible by their own size)
        if cursor % block_size != 0:
            cursor += block_size - (cursor % block_size)

        if cursor + block_size > end:
            raise ValueError(
                f"base network {base_cidr} is too small to fit '{name}' "
                f"needing {hosts_needed} hosts after prior allocations"
            )

        allocations.append({
            "name": name,
            "hosts_needed": hosts_needed,
            "cidr": f"{int_to_ip(cursor)}/{prefix}",
            **subnet_info(f"{int_to_ip(cursor)}/{prefix}"),
        })
        cursor += block_size

    return allocations


# -------------------------------------------------------------- self-test --
def _self_test(trials=500):
    """Cross-checks this file's manual bit math against Python's own
    `ipaddress` standard library module across random CIDRs. Only place in
    this file that imports ipaddress -- used purely as an oracle."""
    import ipaddress

    random.seed(42)
    mismatches = 0
    for _ in range(trials):
        ip = ".".join(str(random.randint(0, 255)) for _ in range(4))
        prefix = random.randint(0, 32)
        cidr = f"{ip}/{prefix}"
        try:
            net = ipaddress.ip_network(cidr, strict=False)
        except ValueError:
            continue

        mine = subnet_info(f"{net.network_address}/{prefix}")
        oracle_network = str(net.network_address)
        oracle_broadcast = str(net.broadcast_address)

        if mine["network"] != oracle_network or mine["broadcast"] != oracle_broadcast:
            mismatches += 1
            print(f"MISMATCH on {cidr}: mine={mine['network']}/{mine['broadcast']} "
                  f"oracle={oracle_network}/{oracle_broadcast}")

    print(f"\nSelf-test: {trials - mismatches}/{trials} matched Python's ipaddress module.")
    return mismatches == 0


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "--self-test":
        ok = _self_test()
        sys.exit(0 if ok else 1)
    elif len(sys.argv) == 2:
        print_info(sys.argv[1])
    else:
        print("Usage: python subnet_calc.py <ip/prefix>")
        print("       python subnet_calc.py --self-test")
        print()
        print("Example: python subnet_calc.py 192.168.1.0/26")
