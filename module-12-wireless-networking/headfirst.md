# Head First: Your Wi-Fi Password Is Never Actually Sent Anywhere

## The PMK is a secret both sides derive, not a secret either side transmits

Every device that's ever joined your Wi-Fi network computed the exact
same 256-bit PMK independently, from the passphrase you typed and your
network's SSID, using PBKDF2 — the same "stretch a password into a strong
key" technique you'll see again in Module 13. Nobody ever sends the PMK
over the air. Nobody ever sends your passphrase over the air either. The
4-way handshake exists specifically to let two devices that ALREADY,
independently, derived the same PMK **prove** they both hold it — without
either one ever saying it out loud.

**Brain power:** `wpa_handshake_sim.py` never transmits the PTK between
`ap` and `sta` — no line of code copies `ap.ptk` into `sta.ptk`. And yet
the script's final check confirms they're byte-identical. How? Both sides
compute PTK from the SAME formula, fed the SAME four inputs: the (already
shared) PMK, both MAC addresses, and both nonces (exchanged openly in
messages 1 and 2). Nonces aren't secret — sending them in the clear is
fine, because the PMK itself (which never crosses the air) is what makes
the resulting PTK computation infeasible for an eavesdropper to reproduce
without also somehow knowing the passphrase.

## Why a nonce, and why does it have to be random

"Nonce" means "number used once." Every single handshake — even between
the exact same AP and device, reconnecting minutes later — generates
brand-new ANonce and SNonce values. If nonces were reused, an attacker who
'd captured one prior handshake's PTK (through some other means) could
potentially predict or replay future ones for the same MAC pair. Fresh
randomness each time means each PTK is genuinely unique per session, even
between the same two devices, even with the exact same never-changing
PMK underneath.

## PBKDF2's iteration count is a deliberate speed bump, not a bug

4096 iterations of HMAC-SHA1 isn't slow by accident — it's slow ON
PURPOSE, to make brute-forcing a weak passphrase computationally
expensive. Every guess an attacker tries (in an offline dictionary attack
against a captured handshake) costs 4096 HMAC operations, not one. This is
the exact same design principle as modern password hashing (bcrypt,
Argon2, scrypt) — deliberately expensive derivation, so guessing many
candidates is expensive too. Exercise 3 asks you to time this yourself and
feel the tradeoff directly: fast enough that your own devices don't notice
the delay when connecting, slow enough to meaningfully throttle brute-force
guessing (though 4096 is considered relatively low by modern standards,
which is exactly why weak/short WPA2 passphrases remain crackable in
reasonable time with dictionary attacks — strength of the PASSPHRASE
itself, not the fixed iteration count, is what actually protects you).

## Beacons are a megaphone, not a whisper

Every beacon frame `wifi_frame_builder.py` builds is broadcast,
unencrypted, to literally anyone within radio range — no association, no
authentication, nothing required to receive and parse it. This is why your
phone can show you a list of "available networks" before you've connected
to any of them: it's just been passively listening to megaphone
announcements the whole time. Hiding your SSID doesn't meaningfully change
this — it only stops the megaphone from including the network's name in
its OWN broadcast, but Probe Request/Response frames (the "is anyone
here / yes, X is here" exchange during actual connection) still say the
SSID out loud to anyone capturing at the right moment, which happens
constantly as devices reconnect throughout the day.

## Self-test before moving on

- Explain, mechanically, how two devices can prove they both hold the
  same secret PMK without ever transmitting that secret.
- Why must ANonce and SNonce be freshly random every single handshake,
  even between the same two devices reconnecting?
- Why does hiding your SSID provide close to zero real security benefit,
  given what Probe Request/Response frames reveal?
