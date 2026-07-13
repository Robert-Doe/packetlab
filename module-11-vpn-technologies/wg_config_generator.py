"""
Module 11 -- generates a complete, valid pair of WireGuard config files for
a two-peer tunnel (e.g. your laptop <-> a small VPS, or two of your own
machines). Every key is real (wg_keygen.py). The resulting .conf files are
in the exact format `wg-quick` expects -- copy them to real machines with
WireGuard installed and the tunnel will actually come up.

This script generates and PRINTS configs; it never writes them to a
running WireGuard interface itself, and never transmits anything over a
real network. See DECISIONS.md and ../SAFETY.md.
"""
import sys

from wg_keygen import generate_keypair


def build_configs(
    peer_a_name="laptop",
    peer_b_name="vps",
    peer_a_tunnel_ip="10.10.0.1/24",
    peer_b_tunnel_ip="10.10.0.2/24",
    peer_b_endpoint="203.0.113.50:51820",
    listen_port=51820,
):
    a_priv, a_pub = generate_keypair()
    b_priv, b_pub = generate_keypair()

    config_a = (
        f"# {peer_a_name}.conf -- run `wg-quick up ./{peer_a_name}.conf` on {peer_a_name}\n"
        f"[Interface]\n"
        f"PrivateKey = {a_priv}\n"
        f"Address = {peer_a_tunnel_ip}\n"
        f"\n"
        f"[Peer]\n"
        f"# this is {peer_b_name}\n"
        f"PublicKey = {b_pub}\n"
        f"Endpoint = {peer_b_endpoint}\n"
        f"AllowedIPs = {peer_b_tunnel_ip.split('/')[0]}/32\n"
        f"PersistentKeepalive = 25\n"
    )

    config_b = (
        f"# {peer_b_name}.conf -- run `wg-quick up ./{peer_b_name}.conf` on {peer_b_name}\n"
        f"[Interface]\n"
        f"PrivateKey = {b_priv}\n"
        f"Address = {peer_b_tunnel_ip}\n"
        f"ListenPort = {listen_port}\n"
        f"\n"
        f"[Peer]\n"
        f"# this is {peer_a_name}\n"
        f"PublicKey = {a_pub}\n"
        f"AllowedIPs = {peer_a_tunnel_ip.split('/')[0]}/32\n"
    )

    return config_a, config_b


def main():
    config_a, config_b = build_configs()

    print("=" * 70)
    print("laptop.conf")
    print("=" * 70)
    print(config_a)

    print("=" * 70)
    print("vps.conf")
    print("=" * 70)
    print(config_b)

    print("=" * 70)
    print("Notes")
    print("=" * 70)
    print("- 'laptop' has no ListenPort -- it initiates the connection outward,")
    print("  same as any client. 'vps' needs a fixed ListenPort because it's the")
    print("  side other peers connect TO (change the Endpoint IP to your real")
    print("  second machine's real reachable address before using this for real).")
    print("- AllowedIPs on each side is deliberately narrow (/32, just the other")
    print("  peer's single tunnel address) -- this is a point-to-point tunnel,")
    print("  not a full site-to-site VPN routing whole subnets. Exercise 2 asks")
    print("  you to widen this for a site-to-site scenario.")
    print("- PersistentKeepalive on the client side helps it stay reachable")
    print("  through NAT (Module 10) -- without it, the vps side's replies might")
    print("  arrive after the laptop's NAT/firewall state entry has expired.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        # Confirm the generator produces syntactically well-formed configs
        # with genuinely different key material each run.
        a1, b1 = build_configs()
        a2, b2 = build_configs()
        assert "PrivateKey = " in a1 and "PublicKey = " in a1
        assert a1 != a2, "two runs produced identical keys -- randomness is broken"
        print("Self-test passed: configs are well-formed and keys are unique per run.")
    else:
        main()
