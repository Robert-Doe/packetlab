"""
Module 12 -- builds a real 802.11 beacon frame byte-by-byte, same
struct-based technique as Module 02's layer_builder.py. A beacon is the
frame your AP broadcasts roughly 10 times per second, unencrypted, so any
device in range can discover the network exists before ever associating
with it -- which is exactly why your phone shows you a list of nearby
Wi-Fi networks without you having connected to any of them yet.
"""
import struct


def build_frame_control(frame_type: int, subtype: int) -> int:
    """The 2-byte Frame Control field's most important bits: protocol
    version (always 0), type (0=management, 1=control, 2=data), and
    subtype (which specific frame within that type -- 8 = beacon)."""
    protocol_version = 0
    return (protocol_version) | (frame_type << 2) | (subtype << 4)


def build_beacon_frame(bssid_hex: str, ssid: str, beacon_interval=100, channel=6) -> bytes:
    fc = build_frame_control(frame_type=0, subtype=8)  # type=management(0), subtype=beacon(8)
    duration = 0
    bssid = bytes.fromhex(bssid_hex.replace(":", ""))

    # Management frame header: FC(2) + Duration(2) + DA(6) + SA(6) + BSSID(6) + SeqCtl(2)
    header = struct.pack("!H", fc)
    header += struct.pack("!H", duration)
    header += b"\xff" * 6           # DA: broadcast (beacons go to everyone)
    header += bssid                  # SA: the AP's own MAC
    header += bssid                  # BSSID: same as SA for an AP
    header += struct.pack("!H", 0)   # sequence control (simplified: always 0 here)

    # Fixed parameters: timestamp(8) + beacon interval(2) + capability info(2)
    fixed = struct.pack("!Q", 0)  # timestamp -- real APs put microseconds-since-up here
    fixed += struct.pack("!H", beacon_interval)  # in "time units" of 1024 microseconds
    fixed += struct.pack("!H", 0x0411)  # capability info: ESS + privacy (WPA2) bits set

    # Tagged parameters (information elements): SSID, then supported rates, then channel
    ssid_ie = struct.pack("!BB", 0, len(ssid)) + ssid.encode()  # tag 0 = SSID
    channel_ie = struct.pack("!BBB", 3, 1, channel)              # tag 3 = DS Parameter Set (channel)

    return header + fixed + ssid_ie + channel_ie


def parse_frame_control(fc: int) -> dict:
    return {
        "protocol_version": fc & 0b11,
        "type": (fc >> 2) & 0b11,
        "subtype": (fc >> 4) & 0b1111,
    }


FRAME_TYPE_NAMES = {0: "Management", 1: "Control", 2: "Data"}
MGMT_SUBTYPE_NAMES = {0: "Association Request", 1: "Association Response", 4: "Probe Request",
                       5: "Probe Response", 8: "Beacon", 11: "Authentication", 12: "Deauthentication"}


def describe_frame(frame: bytes):
    fc = struct.unpack("!H", frame[0:2])[0]
    parsed = parse_frame_control(fc)
    type_name = FRAME_TYPE_NAMES.get(parsed["type"], "Unknown")
    subtype_name = MGMT_SUBTYPE_NAMES.get(parsed["subtype"], "Unknown") if parsed["type"] == 0 else "N/A"
    bssid = frame[10:16].hex(":")

    offset = 24 + 12  # header (24) + fixed params (12)
    ie_tag, ie_len = struct.unpack("!BB", frame[offset:offset + 2])
    ssid = frame[offset + 2:offset + 2 + ie_len].decode()

    print(f"  Frame Control: type={parsed['type']} ({type_name}), subtype={parsed['subtype']} ({subtype_name})")
    print(f"  BSSID: {bssid}")
    print(f"  SSID (from tagged parameter, tag={ie_tag}): {ssid!r}")


def main():
    frame = build_beacon_frame("aa:bb:cc:11:22:33", "MyHomeNetwork", channel=6)
    print(f"Built a {len(frame)}-byte beacon frame:\n")
    print("  " + frame.hex())
    print()
    describe_frame(frame)

    print("\nWhy this matters: every SSID your phone lists as 'available networks'")
    print("came from parsing exactly this frame type -- unencrypted, broadcast,")
    print("no association required. This is also why hiding your SSID (disabling")
    print("beacon SSID broadcast) provides near-zero real security: Probe Request/")
    print("Response frames (subtypes 4/5) still leak the SSID to anyone who")
    print("captures a device actively connecting, which happens constantly.")


if __name__ == "__main__":
    main()
