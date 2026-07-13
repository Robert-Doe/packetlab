@echo off
REM Module 04 launcher -- runs both self-tests, then starts the quiz.

echo === Python self-test (vs. ipaddress stdlib) ===
python subnet_calc.py --self-test

echo.
echo === Node self-test (vs. subnet_calc.py) ===
node subnet_calc.js --self-test 50

echo.
echo === Starting quiz (10 questions) ===
python subnet_quiz.py 10
