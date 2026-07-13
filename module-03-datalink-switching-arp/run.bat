@echo off
REM Module 03 launcher. Both variants are one-shot simulations -- run each
REM and compare their output (see tutorial.html Step 1).

echo === Python variant ===
python switch_sim.py
echo.
echo === Node variant ===
node switch_sim.js
