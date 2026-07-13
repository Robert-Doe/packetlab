@echo off
REM Module 09 launcher -- runs the plan generator only. Everything else in
REM this module (virtual lab, bridge mode) is a manual, hands-on process
REM described in the .md guides -- there's nothing else this course can
REM run on your behalf. See tutorial.html.

echo Usage: run.bat [your-real-subnet-cidr]
echo Example: run.bat 192.168.0.0/24
echo.

set SUBNET=%1
if "%SUBNET%"=="" set SUBNET=192.168.0.0/24

python lab_plan_generator.py %SUBNET%
