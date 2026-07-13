@echo off
REM Module 00b launcher -- compiles and runs the C files via WSL (requires
REM `wsl --install` and a distro with gcc, e.g. `sudo apt install gcc`).

echo Compiling and running via WSL...
wsl -d Ubuntu -- bash -c "cd $(wslpath '%cd%') && make run"

echo.
echo === memory_safety_contrast.js (Node, Windows side) ===
node memory_safety_contrast.js

echo.
echo Now read tutorial2.html (deep theory) and tutorial3.html (exam practice).
