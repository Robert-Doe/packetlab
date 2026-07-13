@echo off
REM Module 00c launcher -- runs via WSL (a real Linux shell is required).

echo === Filesystem and permissions ===
wsl -d Ubuntu -- bash -c "cd $(wslpath '%cd%') && chmod +x filesystem_and_permissions.sh && ./filesystem_and_permissions.sh"

echo.
echo === Package management (read-only / simulated) ===
wsl -d Ubuntu -- bash -c "cd $(wslpath '%cd%') && chmod +x package_management.sh && ./package_management.sh"

echo.
echo === systemd service demo ===
echo See tutorial.html Step 2 for the full systemd walkthrough (install,
echo start, inspect, enable/disable, and clean teardown).
