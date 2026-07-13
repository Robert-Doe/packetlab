@echo off
REM Module 17 launcher -- runs the tested auditor. Terraform
REM init/validate/plan/apply are deliberate, separate steps you run
REM yourself against your own AWS account -- see tutorial.html.

echo === Security group rule auditor (Python) ===
python sg_rule_auditor.py

echo.
echo === Security group rule auditor (Node) ===
node sg_rule_auditor.js

echo.
echo To validate the Terraform yourself:
echo   cd terraform
echo   terraform init
echo   terraform validate
echo   terraform plan
