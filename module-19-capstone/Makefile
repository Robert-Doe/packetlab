.PHONY: check

check:
	python3 capstone_checker.py sample_manifest_complete.json
	python3 capstone_checker.py sample_manifest_incomplete.json
	node capstone_checker.js sample_manifest_complete.json
	node capstone_checker.js sample_manifest_incomplete.json
