@echo off
REM Module 19 launcher -- verifies the checker against both sample
REM manifests. Your actual capstone build is the real work of this
REM module -- see capstone_brief.md.

echo === Checker against COMPLETE sample manifest (expect 100%%) ===
python capstone_checker.py sample_manifest_complete.json

echo.
echo === Checker against INCOMPLETE sample manifest (expect gaps) ===
python capstone_checker.py sample_manifest_incomplete.json

echo.
echo === Node: same two checks ===
node capstone_checker.js sample_manifest_complete.json
node capstone_checker.js sample_manifest_incomplete.json

echo.
echo Now build your own capstone per capstone_brief.md, write your own
echo manifest, and run: python capstone_checker.py your_manifest.json
