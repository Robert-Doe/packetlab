@echo off
REM Module 11 launcher.

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo === Python: real key generation + verification ===
python wg_keygen.py
echo.
echo === Python: two-peer config generation ===
python wg_config_generator.py

echo.
echo === Node: real key generation + verification ===
node wg_keygen.js
echo.
echo === Node: two-peer config generation ===
node wg_config_generator.js

echo.
echo Actual tunnel bring-up requires WireGuard installed on 2 real machines.
echo See tutorial.html Step 3.
