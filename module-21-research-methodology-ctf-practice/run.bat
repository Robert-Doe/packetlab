@echo off
REM Module 21 launcher -- compiles and solves the CTF challenge via WSL
REM (requires `wsl --install` and a distro with gcc, e.g. `sudo apt
REM install gcc`), then runs the research/disclosure checkers.

echo Compiling and solving the CTF challenge via WSL...
wsl -d Ubuntu -- bash -c "cd $(wslpath '%cd%') && make solve"

echo.
echo === solve_crackme.js (Node, Windows side -- flag recovery only, no --verify) ===
echo (Windows Node cannot execute the WSL-compiled Linux ELF binary directly --
echo  this is a genuine cross-platform limitation, not a bug; see DECISIONS.md)
node ctf_challenge\solve_crackme.js ctf_challenge\crackme

echo.
echo === research_notes_checker.js and disclosure_timeline_checker.js (Node) ===
node research_notes_checker.js sample_research_log_complete.json
node disclosure_timeline_checker.js sample_disclosure_complete.json

echo.
echo Now read tutorial2.html (deep theory) and tutorial3.html (exam practice).
