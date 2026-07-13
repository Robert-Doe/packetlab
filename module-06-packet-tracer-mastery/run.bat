@echo off
REM Module 06 launcher -- runs the validator against both topologies.
REM Packet Tracer itself must be installed and run separately (see tutorial.html Step 0).

echo === Topology 2 validator (Python) ===
python topology_validator.py topology_configs\topology2_two_lans_one_hop.json
echo.
echo === Topology 2 validator (Node) ===
node topology_validator.js topology_configs\topology2_two_lans_one_hop.json

echo.
echo === Topology 3 validator (Python) ===
python topology_validator.py topology_configs\topology3_three_router_chain.json
echo.
echo === Topology 3 validator (Node) ===
node topology_validator.js topology_configs\topology3_three_router_chain.json
