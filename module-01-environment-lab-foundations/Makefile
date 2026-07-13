.PHONY: run run-python run-node setup clean

venv/bin/activate: requirements.txt
	python3 -m venv venv
	./venv/bin/pip install -q -r requirements.txt

setup: venv/bin/activate

run-python: setup
	@echo "Python dashboard: http://127.0.0.1:5000"
	./venv/bin/python netinfo_server.py

run-node:
	@echo "Node dashboard: http://127.0.0.1:5050"
	node netinfo.js

run: setup
	@echo "Starting both variants -- Python here, Node backgrounded."
	@echo "Python: http://127.0.0.1:5000   Node: http://127.0.0.1:5050"
	node netinfo.js & \
	./venv/bin/python netinfo_server.py

clean:
	rm -rf venv __pycache__ server_out.log node_out.log
