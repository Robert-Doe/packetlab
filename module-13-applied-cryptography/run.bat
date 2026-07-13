@echo off
REM Module 13 launcher.

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo === Building toy CA and issuing a certificate ===
python toy_ca.py

echo.
echo Starting TLS server in a new window...
start "Module 13 - TLS server" cmd /k python tls_server.py

echo.
echo Now run, in this window or another:
echo   python tls_client.py
echo   node tls_client.js
