@echo off
REM Module 02 launcher. Starts the target server; run traffic_generator.py
REM and/or layer_builder.py yourself in a second terminal per tutorial.html.

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo.
echo Starting target server: http://127.0.0.1:8080/layer-demo
echo In a SECOND terminal, run: python traffic_generator.py
echo (Start your Wireshark capture before running traffic_generator.py)
echo.

python http_target_server.py
