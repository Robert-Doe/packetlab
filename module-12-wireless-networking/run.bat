@echo off
REM Module 12 launcher -- all one-shot scripts, both languages.

echo === PMK derivation (Python) ===
python wpa2_psk_derivation.py
echo.
echo === PMK derivation (Node) ===
node wpa2_psk_derivation.js

echo.
echo === 4-way handshake simulation (Python) ===
python wpa_handshake_sim.py
echo.
echo === 4-way handshake simulation (Node) ===
node wpa_handshake_sim.js

echo.
echo === 802.11 beacon frame builder (Python) ===
python wifi_frame_builder.py
echo.
echo === 802.11 beacon frame builder (Node) ===
node wifi_frame_builder.js
