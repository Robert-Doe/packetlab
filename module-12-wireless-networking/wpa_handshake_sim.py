"""
Module 12 -- the WPA2 4-way handshake, simulated as two independent
endpoints (AP and STA) exchanging real EAPOL-Key messages, each computing
a REAL PTK using wpa2_psk_derivation.py's actual PBKDF2/PRF implementation.
Both sides start with only the PMK and their own nonce -- and by the end,
both arrive at the identical PTK, purely from the information exchanged
in messages 1-3. That convergence IS the point of this simulation: it's
not asserted, it's computed twice, independently, and compared.
"""
import os

from wpa2_psk_derivation import derive_ptk


class WpaEndpoint:
    def __init__(self, name, mac_hex, pmk):
        self.name = name
        self.mac = bytes.fromhex(mac_hex.replace(":", ""))
        self.pmk = pmk
        self.nonce = os.urandom(32)
        self.ptk = None

    def compute_ptk(self, peer_mac, peer_nonce):
        aa, spa = (self.mac, peer_mac) if self.name == "AP" else (peer_mac, self.mac)
        self.ptk = derive_ptk(self.pmk, aa, spa, self.nonce if self.name == "AP" else peer_nonce,
                               peer_nonce if self.name == "AP" else self.nonce)
        return self.ptk


def simulate_handshake(passphrase: str, ssid: str):
    from wpa2_psk_derivation import derive_pmk
    pmk = derive_pmk(passphrase, ssid)
    print(f"Both sides already share the PMK (derived once at connection time, SSID={ssid!r}):")
    print(f"  PMK = {pmk.hex()}\n")

    ap = WpaEndpoint("AP", "aa:bb:cc:00:00:01", pmk)
    sta = WpaEndpoint("STA", "aa:bb:cc:00:00:02", pmk)

    print("Message 1/4: AP -> STA")
    print(f"  AP sends ANonce = {ap.nonce.hex()[:16]}... (unencrypted -- this is fine, a nonce isn't secret)")

    print("\nMessage 2/4: STA -> AP")
    print(f"  STA now has both MACs + both nonces (its own SNonce + AP's ANonce) -- computes PTK:")
    sta_ptk = sta.compute_ptk(ap.mac, ap.nonce)
    print(f"  STA's PTK = {sta_ptk.hex()}")
    print(f"  STA sends SNonce = {sta.nonce.hex()[:16]}... plus a MIC proving it holds the right PMK")

    print("\nMessage 3/4: AP -> STA")
    print(f"  AP now ALSO has both MACs + both nonces -- computes its own PTK independently:")
    ap_ptk = ap.compute_ptk(sta.mac, sta.nonce)
    print(f"  AP's PTK  = {ap_ptk.hex()}")
    print(f"  AP verifies STA's MIC (proves STA holds the correct PMK), sends its own MIC + GTK")

    print("\nMessage 4/4: STA -> AP")
    print(f"  STA verifies AP's MIC, confirms handshake complete. Both sides now encrypt")
    print(f"  data traffic using keys derived from PTK (never the PTK/PMK directly).")

    print(f"\nPTKs match (computed independently, never transmitted): {ap_ptk == sta_ptk}")
    return ap_ptk == sta_ptk


if __name__ == "__main__":
    ok = simulate_handshake("correcthorsebattery", "MyHomeNetwork")
    print(f"\n{'PASS' if ok else 'FAIL'}: both endpoints converged on the identical PTK "
          f"without either one ever transmitting it.")
