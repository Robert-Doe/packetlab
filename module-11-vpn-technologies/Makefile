.PHONY: setup keygen config

venv/bin/activate: requirements.txt
	python3 -m venv venv
	./venv/bin/pip install -q -r requirements.txt

setup: venv/bin/activate

keygen: setup
	./venv/bin/python wg_keygen.py
	node wg_keygen.js

config: setup
	./venv/bin/python wg_config_generator.py
	node wg_config_generator.js
