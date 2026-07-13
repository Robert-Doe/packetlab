@echo off
REM Module 05 launcher -- both scripts are one-shot simulations.

echo === Static routing / longest-prefix-match trace ===
python static_routing.py
echo.
node static_routing.js

echo.
echo === RIP (distance-vector) vs OSPF (link-state) ===
python routing_protocols_sim.py
echo.
node routing_protocols_sim.js
