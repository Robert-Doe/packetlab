"""
Module 09 -- turns your real home subnet into a concrete 3-VLAN plan:
Main, IoT/Guest, and Lab, each sized to how many devices you tell it you
have, plus a firewall-rule outline expressing the isolation goals from
home_lab_design.md. This is Module 04's VLSM allocator, applied to a real
design decision instead of a made-up exercise.

This script only computes and prints a plan -- it makes no changes to any
device, real or virtual. You still configure pfSense/OPNsense (or your
real router) by hand, using this as your reference numbers.
"""
import sys


def ip_to_int(ip: str) -> int:
    o = [int(x) for x in ip.split(".")]
    return (o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]


def int_to_ip(n: int) -> str:
    return ".".join(str((n >> s) & 0xFF) for s in (24, 16, 8, 0))


def prefix_to_mask_int(prefix: int) -> int:
    return 0 if prefix == 0 else (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF


def subnet_info(cidr: str) -> dict:
    ip_str, prefix = cidr.split("/")
    prefix = int(prefix)
    mask_int = prefix_to_mask_int(prefix)
    network_int = ip_to_int(ip_str) & mask_int
    broadcast_int = network_int | (~mask_int & 0xFFFFFFFF)
    usable = max((1 << (32 - prefix)) - 2, 0)
    return {
        "cidr": f"{int_to_ip(network_int)}/{prefix}",
        "network": int_to_ip(network_int),
        "broadcast": int_to_ip(broadcast_int),
        "first_host": int_to_ip(network_int + 1) if usable else None,
        "last_host": int_to_ip(broadcast_int - 1) if usable else None,
        "usable_hosts": usable,
        "prefix": prefix,
    }


def smallest_prefix_for(host_count: int) -> int:
    needed = host_count + 2
    prefix = 32
    while (1 << (32 - prefix)) < needed:
        prefix -= 1
    return prefix


def build_plan(base_cidr: str, segments: list):
    """segments: list of (name, vlan_id, host_count). Largest first, same
    packing strategy as Module 04's vlsm_allocate."""
    base_ip_str, base_prefix = base_cidr.split("/")
    base_prefix = int(base_prefix)
    base_network = ip_to_int(base_ip_str) & prefix_to_mask_int(base_prefix)
    end = base_network + (1 << (32 - base_prefix))

    ordered = sorted(segments, key=lambda s: s[2], reverse=True)
    cursor = base_network
    plan = []
    for name, vlan_id, host_count in ordered:
        prefix = smallest_prefix_for(host_count)
        block_size = 1 << (32 - prefix)
        if cursor % block_size != 0:
            cursor += block_size - (cursor % block_size)
        if cursor + block_size > end:
            raise ValueError(f"{base_cidr} is too small to fit '{name}' needing {host_count} hosts")
        cidr = f"{int_to_ip(cursor)}/{prefix}"
        info = subnet_info(cidr)
        plan.append({"name": name, "vlan_id": vlan_id, "host_count": host_count, **info})
        cursor += block_size

    return sorted(plan, key=lambda p: p["vlan_id"])


def print_plan(plan):
    print("VLAN plan:")
    for seg in plan:
        print(f"  VLAN {seg['vlan_id']:<4} {seg['name']:<12} {seg['cidr']:<18} "
              f"({seg['usable_hosts']} usable, needed {seg['host_count']})")

    print("\nFirewall rule outline (isolation goals from home_lab_design.md):")
    by_name = {seg["name"]: seg for seg in plan}
    if "Main" in by_name and "Lab" in by_name:
        print(f"  ALLOW  {by_name['Main']['cidr']} -> {by_name['Lab']['cidr']}   (you administering your lab)")
        print(f"  BLOCK  {by_name['Lab']['cidr']} -> {by_name['Main']['cidr']}   (a compromised lab VM can't reach your devices)")
    if "IoT/Guest" in by_name:
        for other in plan:
            if other["name"] != "IoT/Guest":
                print(f"  BLOCK  {by_name['IoT/Guest']['cidr']} -> {other['cidr']}   (isolate IoT/guest from everything else)")
        print(f"  ALLOW  {by_name['IoT/Guest']['cidr']} -> 0.0.0.0/0   (internet access only)")


def main():
    base_cidr = sys.argv[1] if len(sys.argv) > 1 else "192.168.0.0/24"
    print(f"Base network: {base_cidr}\n")

    segments = [
        ("Main", 10, 20),       # your trusted personal devices
        ("IoT/Guest", 20, 30),  # smart home + guest devices
        ("Lab", 30, 10),        # this course's future lab VMs
    ]
    plan = build_plan(base_cidr, segments)
    print_plan(plan)


if __name__ == "__main__":
    main()
