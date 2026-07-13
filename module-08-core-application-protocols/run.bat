@echo off
REM Module 08 launcher.

echo === DHCP DORA simulation (one-shot) ===
python dhcp_dora_sim.py

echo.
echo Starting DNS server (port 5053) in a new window...
start "Module 08 - DNS server" cmd /k python dns_server.py

echo Starting hand-rolled HTTP server (port 8090) in a new window...
start "Module 08 - HTTP server" cmd /k python http_server_from_scratch.py

echo.
echo Now run, in this window or another:
echo   python dns_client.py
echo   curl -i http://127.0.0.1:8090/
