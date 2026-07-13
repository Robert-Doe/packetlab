@echo off
REM Module 18 launcher -- builds, reads, and reconstructs, both languages.

echo === Writing incident.pcap (Python) ===
python pcap_writer.py

echo.
echo === Reading it back (Python) ===
python pcap_reader.py incident.pcap

echo.
echo === Reconstructing the incident timeline (Python) ===
python incident_timeline.py incident.pcap

echo.
echo === Writing incident_node.pcap (Node) ===
node pcap_writer.js

echo.
echo === Reconstructing the incident timeline (Node) ===
node incident_timeline.js incident_node.pcap

echo.
echo Open incident.pcap in real Wireshark to confirm it independently.
