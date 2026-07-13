.PHONY: run

run:
	python3 generate_conn_log.py
	python3 conn_log_analyzer.py
	node generate_conn_log.js
	node conn_log_analyzer.js conn_node.log
	python3 mini_ids_rules.py
	node mini_ids_rules.js
