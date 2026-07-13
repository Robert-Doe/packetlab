@echo off
REM Module 15 launcher -- generates and validates shipping formats.
REM Bringing up the actual Docker stack is a deliberate, separate step:
REM   docker compose up -d
REM See tutorial.html for the full walkthrough.

echo === Log shipper (Python) ===
python log_shipper.py

echo.
echo === Log shipper (Node) ===
node log_shipper.js

echo.
echo === Validating docker-compose.yml syntax ===
docker compose config >nul 2>&1 && echo   OK || echo   FAILED -- is Docker installed?

echo.
echo To bring up the real stack: docker compose up -d
echo Then follow tutorial.html Steps 2-4.
