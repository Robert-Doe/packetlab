"""
Module 03 -- a real Layer 2 switch's core algorithm, simulated in software:
MAC-address learning (the "CAM table"), flooding of unknown/broadcast
frames, and 802.1Q VLAN tagging that splits one physical switch into
separate broadcast domains.

Every frame here is real bytes (built the same way Module 02 built its
frame, with struct.pack), just delivered by Python function calls instead
of a NIC -- so you can print and inspect every step no hardware could show
you this clearly. All MACs use the same non-routable de:ad:be:ef prefix as
Module 02; IPs use RFC 5737 documentation ranges.
"""
import struct


def mac_str(mac: bytes) -> str:
    return mac.hex(":")


def ip_to_bytes(ip: str) -> bytes:
    return bytes(int(o) for o in ip.split("."))


def ip_str(b: bytes) -> str:
    return ".".join(str(o) for o in b)


BROADCAST = b"\xff" * 6


# --------------------------------------------------------------- frames ---
def build_frame(dst_mac: bytes, src_mac: bytes, ethertype: int, payload: bytes, vlan_id=None) -> bytes:
    if vlan_id is not None:
        tag = struct.pack("!HH", 0x8100, vlan_id & 0x0FFF)  # TPID + VLAN in TCI
        return dst_mac + src_mac + tag + struct.pack("!H", ethertype) + payload
    return dst_mac + src_mac + struct.pack("!H", ethertype) + payload


def parse_frame(frame: bytes) -> dict:
    dst, src = frame[0:6], frame[6:12]
    idx = 12
    vlan_id = None
    ethertype = struct.unpack("!H", frame[idx:idx + 2])[0]
    if ethertype == 0x8100:
        tci = struct.unpack("!H", frame[idx + 2:idx + 4])[0]
        vlan_id = tci & 0x0FFF
        idx += 4
        ethertype = struct.unpack("!H", frame[idx:idx + 2])[0]
    idx += 2
    return {"dst": dst, "src": src, "ethertype": ethertype, "vlan_id": vlan_id, "payload": frame[idx:]}


# ----------------------------------------------------------------- ARP ---
ETHERTYPE_ARP = 0x0806
ARP_REQUEST, ARP_REPLY = 1, 2


def build_arp(op: int, sender_mac: bytes, sender_ip: str, target_mac: bytes, target_ip: str) -> bytes:
    return struct.pack(
        "!HHBBH6s4s6s4s",
        1, 0x0800, 6, 4, op,
        sender_mac, ip_to_bytes(sender_ip),
        target_mac, ip_to_bytes(target_ip),
    )


def parse_arp(payload: bytes) -> dict:
    htype, ptype, hlen, plen, op, sender_mac, sender_ip, target_mac, target_ip = struct.unpack(
        "!HHBBH6s4s6s4s", payload
    )
    return {
        "op": op, "sender_mac": sender_mac, "sender_ip": ip_str(sender_ip),
        "target_mac": target_mac, "target_ip": ip_str(target_ip),
    }


# ------------------------------------------------------------- Switch ----
class Switch:
    def __init__(self, port_vlan: dict):
        self.port_vlan = port_vlan       # port number -> VLAN id
        self.cam_table = {}              # (vlan_id, mac_bytes) -> port number
        self.hosts = {}                  # port number -> Host

    def connect(self, port: int, host: "Host"):
        self.hosts[port] = host
        host.attach(self, port)

    def dump_cam_table(self):
        print("  CAM table:")
        if not self.cam_table:
            print("    (empty)")
        for (vlan, mac), port in self.cam_table.items():
            print(f"    VLAN {vlan:<3} {mac_str(mac)} -> port {port}")

    def receive(self, in_port: int, frame_bytes: bytes):
        parsed = parse_frame(frame_bytes)
        vlan = parsed["vlan_id"] if parsed["vlan_id"] is not None else self.port_vlan[in_port]

        learned_before = (vlan, parsed["src"]) in self.cam_table
        self.cam_table[(vlan, parsed["src"])] = in_port
        if not learned_before:
            print(f"    [switch] learned {mac_str(parsed['src'])} is on port {in_port} (VLAN {vlan})")

        if parsed["dst"] == BROADCAST:
            print(f"    [switch] broadcast frame on VLAN {vlan} -> flooding to VLAN {vlan} ports only")
            self._flood(in_port, vlan, frame_bytes)
            return

        key = (vlan, parsed["dst"])
        if key in self.cam_table:
            out_port = self.cam_table[key]
            print(f"    [switch] known unicast {mac_str(parsed['dst'])} -> forwarding to port {out_port} ONLY")
            self._deliver(out_port, frame_bytes)
        else:
            print(f"    [switch] unknown unicast {mac_str(parsed['dst'])} -> flooding VLAN {vlan} (like broadcast)")
            self._flood(in_port, vlan, frame_bytes)

    def _flood(self, in_port, vlan, frame_bytes):
        for port, port_vlan in self.port_vlan.items():
            if port != in_port and port_vlan == vlan:
                self._deliver(port, frame_bytes)

    def _deliver(self, port, frame_bytes):
        host = self.hosts.get(port)
        if host:
            host.receive(frame_bytes)


# --------------------------------------------------------------- Host ----
class Host:
    def __init__(self, name: str, mac_hex: str, ip: str):
        self.name = name
        self.mac = bytes.fromhex(mac_hex.replace(":", ""))
        self.ip = ip
        self.arp_cache = {}   # ip -> mac
        self.switch = None
        self.port = None

    def attach(self, switch: Switch, port: int):
        self.switch = switch
        self.port = port

    def send(self, frame_bytes: bytes):
        self.switch.receive(self.port, frame_bytes)

    def arp_request(self, target_ip: str, vlan_id=None):
        print(f"  {self.name}: \"who has {target_ip}? tell {self.ip}\" (broadcast)")
        payload = build_arp(ARP_REQUEST, self.mac, self.ip, b"\x00" * 6, target_ip)
        frame = build_frame(BROADCAST, self.mac, ETHERTYPE_ARP, payload, vlan_id)
        self.send(frame)

    def receive(self, frame_bytes: bytes):
        parsed = parse_frame(frame_bytes)
        if parsed["dst"] not in (self.mac, BROADCAST):
            return
        if parsed["ethertype"] == ETHERTYPE_ARP:
            self._handle_arp(parsed)

    def _handle_arp(self, parsed):
        arp = parse_arp(parsed["payload"])
        if arp["op"] == ARP_REQUEST and arp["target_ip"] == self.ip:
            print(f"  {self.name}: that's me -- replying \"{self.ip} is at {mac_str(self.mac)}\"")
            reply_payload = build_arp(ARP_REPLY, self.mac, self.ip, arp["sender_mac"], arp["sender_ip"])
            reply_frame = build_frame(arp["sender_mac"], self.mac, ETHERTYPE_ARP, reply_payload, parsed["vlan_id"])
            self.send(reply_frame)
        elif arp["op"] == ARP_REPLY and arp["sender_ip"] not in self.arp_cache:
            self.arp_cache[arp["sender_ip"]] = arp["sender_mac"]
            print(f"  {self.name}: got ARP reply, caching {arp['sender_ip']} -> {mac_str(arp['sender_mac'])}")


def main():
    print("Building a 4-port switch: ports 1,2 on VLAN 10; ports 3,4 on VLAN 20\n")
    switch = Switch(port_vlan={1: 10, 2: 10, 3: 20, 4: 20})

    pc_a = Host("PC-A", "de:ad:be:ef:10:01", "192.0.2.11")
    pc_b = Host("PC-B", "de:ad:be:ef:10:02", "192.0.2.12")
    pc_c = Host("PC-C", "de:ad:be:ef:20:01", "192.0.2.21")
    pc_d = Host("PC-D", "de:ad:be:ef:20:02", "192.0.2.22")

    switch.connect(1, pc_a)
    switch.connect(2, pc_b)
    switch.connect(3, pc_c)
    switch.connect(4, pc_d)

    print("=" * 70)
    print("SCENARIO 1: PC-A ARPs for PC-B -- both on VLAN 10")
    print("=" * 70)
    pc_a.arp_request(pc_b.ip)
    print()
    switch.dump_cam_table()
    print(f"  PC-A's ARP cache: { {k: mac_str(v) for k, v in pc_a.arp_cache.items()} }")

    print()
    print("=" * 70)
    print("SCENARIO 2: PC-A ARPs for PC-C's IP -- PC-C is on VLAN 20 (isolated)")
    print("=" * 70)
    pc_a.arp_request(pc_c.ip)
    print(f"  PC-A's ARP cache after: { {k: mac_str(v) for k, v in pc_a.arp_cache.items()} }")
    print("  Notice: no reply logged above. The broadcast never reached VLAN 20 at")
    print("  all -- the switch's flood in Scenario 1 & 2 only ever goes to ports")
    print("  whose VLAN matches the frame's VLAN. This IS what VLAN isolation means")
    print("  at the packet level: not a firewall rule, just the switch refusing to")
    print("  flood across VLAN boundaries in the first place.")

    print()
    print("=" * 70)
    print("SCENARIO 3: PC-A sends a second frame to PC-B -- now a KNOWN unicast")
    print("=" * 70)
    unicast_payload = b"hello PC-B, this is a normal (non-ARP) frame"
    frame = build_frame(pc_b.mac, pc_a.mac, 0x0810, unicast_payload)  # arbitrary made-up ethertype
    pc_a.send(frame)
    print("  (compare this log line to Scenario 1's flood -- same source/dest pair,")
    print("   but now the switch forwards to port 2 ONLY, because it's in the CAM table)")


if __name__ == "__main__":
    main()
