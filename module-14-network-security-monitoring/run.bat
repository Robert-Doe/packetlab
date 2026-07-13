@echo off
REM Module 14 launcher.

echo === Generating synthetic conn.log (Python) ===
python generate_conn_log.py

echo.
echo === Analyzing (Python) ===
python conn_log_analyzer.py

echo.
echo === Generating synthetic conn_node.log (Node) ===
node generate_conn_log.js

echo.
echo === Analyzing (Node) ===
node conn_log_analyzer.js conn_node.log

echo.
echo === Mini-IDS signature engine (Python) ===
python mini_ids_rules.py

echo.
echo === Mini-IDS signature engine (Node) ===
node mini_ids_rules.js
