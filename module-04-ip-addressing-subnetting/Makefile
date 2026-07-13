.PHONY: test quiz

test:
	@echo "=== Python self-test (vs. ipaddress stdlib) ==="
	python3 subnet_calc.py --self-test
	@echo ""
	@echo "=== Node self-test (vs. subnet_calc.py) ==="
	node subnet_calc.js --self-test 50

quiz:
	python3 subnet_quiz.py 10
