@echo off
REM Module 07 launcher. Starts the TCP and UDP echo servers (Python) in
REM new windows; run the client scripts yourself per tutorial.html.

echo === State machine reference (read this first) ===
python tcp_state_machine.py

echo.
echo Starting TCP echo server (port 9007) in a new window...
start "Module 07 - TCP echo server" cmd /k python tcp_echo_server.py

echo Starting UDP echo server (port 9009) in a new window...
start "Module 07 - UDP echo server" cmd /k python udp_echo_server.py

echo.
echo Now run, in this window or another:
echo   python tcp_echo_client.py
echo   python udp_echo_client.py
