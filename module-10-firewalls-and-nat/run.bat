@echo off
REM Module 10 launcher -- one-shot simulation, both languages.

echo === Python ===
python nat_firewall_sim.py
echo.
echo === Node ===
node nat_firewall_sim.js
