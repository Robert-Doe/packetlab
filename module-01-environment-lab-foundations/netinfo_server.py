"""
Module 01 lab server (Python variant).

Introspects THIS machine's own network configuration -- interfaces, default
gateway, DNS servers, ARP cache -- and serves it as JSON plus a live
dashboard. Nothing here sends a single packet onto the network; it only
reads state your OS already collected (interface config, routing table,
resolver config, ARP cache).

Binds to 127.0.0.1 only. See ../SAFETY.md.
"""
import platform
import re
import socket
import subprocess
from pathlib import Path

import psutil
from flask import Flask, jsonify, send_from_directory

BASE = Path(__file__).parent
app = Flask(__name__)

SYSTEM = platform.system()  # "Windows", "Linux", "Darwin"

# psutil reports the raw socket.AddressFamily enum. Windows' str() on it
# gives a bare integer instead of a name, so map the ones you'll actually
# see back to something readable.
_FAMILY_NAMES = {
    socket.AF_INET: "IPv4",
    socket.AF_INET6: "IPv6",
    getattr(psutil, "AF_LINK", -1): "MAC",
}


def _family_name(family):
    return _FAMILY_NAMES.get(family, str(family))


def _run(cmd):
    """Run a shell command and return its stdout as text, or '' on failure."""
    try:
        result = subprocess.run(
            cmd, capture_output=True, timeout=5, shell=False
        )
        return result.stdout.decode(errors="replace")
    except Exception as exc:
        return f"<command failed: {exc}>"


def get_interfaces():
    """Every interface this machine has, with its addresses and up/down state."""
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    interfaces = []
    for name, addr_list in addrs.items():
        stat = stats.get(name)
        interfaces.append(
            {
                "name": name,
                "is_up": stat.isup if stat else None,
                "speed_mbps": stat.speed if stat else None,
                "mtu": stat.mtu if stat else None,
                "addresses": [
                    {
                        "family": _family_name(a.family),
                        "address": a.address,
                        "netmask": a.netmask,
                    }
                    for a in addr_list
                ],
            }
        )
    return interfaces


def get_default_gateway():
    """Cross-platform default gateway lookup by parsing the OS's own tools."""
    if SYSTEM == "Windows":
        out = _run(["ipconfig", "/all"])
        for line in out.splitlines():
            if "Default Gateway" in line:
                parts = line.split(":", 1)
                if len(parts) == 2 and parts[1].strip():
                    return parts[1].strip()
        return None
    elif SYSTEM == "Linux":
        out = _run(["ip", "route", "show", "default"])
        m = re.search(r"default via (\S+)", out)
        return m.group(1) if m else None
    elif SYSTEM == "Darwin":
        out = _run(["route", "-n", "get", "default"])
        m = re.search(r"gateway:\s*(\S+)", out)
        return m.group(1) if m else None
    return None


def get_dns_servers():
    """Cross-platform DNS resolver list."""
    servers = []
    if SYSTEM == "Windows":
        out = _run(["ipconfig", "/all"])
        capturing = False
        for line in out.splitlines():
            if "DNS Servers" in line:
                capturing = True
                val = line.split(":", 1)[1].strip()
                if val:
                    servers.append(val)
                continue
            if capturing:
                stripped = line.strip()
                # Continuation lines are just an indented IP with no label.
                if re.match(r"^[\d.:a-fA-F]+$", stripped):
                    servers.append(stripped)
                else:
                    capturing = False
    else:
        try:
            with open("/etc/resolv.conf") as f:
                for line in f:
                    if line.startswith("nameserver"):
                        servers.append(line.split()[1])
        except FileNotFoundError:
            pass
    # de-duplicate while preserving order
    seen = set()
    unique = []
    for s in servers:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique


def get_arp_table():
    """Parse `arp -a`, which exists on Windows, Linux, and macOS alike."""
    out = _run(["arp", "-a"])
    entries = []
    # Matches lines like:  192.168.1.1   aa-bb-cc-dd-ee-ff   dynamic
    pattern = re.compile(
        r"(\d{1,3}(?:\.\d{1,3}){3}).{1,20}?"
        r"([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}",
    )
    for line in out.splitlines():
        m = pattern.search(line)
        if m:
            entries.append(line.strip())
    return entries


@app.route("/")
def dashboard():
    return send_from_directory(BASE, "dashboard.html")


@app.route("/tutorial.html")
def tutorial():
    return send_from_directory(BASE, "tutorial.html")


@app.route("/api/netinfo")
def api_netinfo():
    return jsonify(
        {
            "system": SYSTEM,
            "interfaces": get_interfaces(),
            "default_gateway": get_default_gateway(),
            "dns_servers": get_dns_servers(),
            "arp_table": get_arp_table(),
        }
    )


if __name__ == "__main__":
    print("=" * 64)
    print(" Module 01 (Python) lab is up.")
    print(" Dashboard : http://127.0.0.1:5000")
    print(" Raw JSON  : http://127.0.0.1:5000/api/netinfo")
    print("=" * 64)
    app.run(host="127.0.0.1", port=5000, debug=False)
