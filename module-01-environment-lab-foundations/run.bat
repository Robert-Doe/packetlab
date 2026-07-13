@echo off
REM Module 01 launcher for Windows. Runs the Python variant in this window
REM and starts the Node variant in a second window, so both dashboards are
REM live at once for side-by-side comparison (Step 2 of tutorial.html).

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo.
echo Starting Node variant in a new window (http://127.0.0.1:5050)...
start "Module 01 - Node variant" cmd /k node netinfo.js

echo Starting Python variant here (http://127.0.0.1:5000)...
echo Press Ctrl+C to stop this one; close the other window to stop Node.
echo.

python netinfo_server.py
