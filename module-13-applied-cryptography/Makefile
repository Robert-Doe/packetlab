.PHONY: setup ca server client

venv/bin/activate: requirements.txt
	python3 -m venv venv
	./venv/bin/pip install -q -r requirements.txt

setup: venv/bin/activate

ca: setup
	./venv/bin/python toy_ca.py

server: setup
	./venv/bin/python tls_server.py

client: setup
	./venv/bin/python tls_client.py
	node tls_client.js
