.PHONY: run build-py build-js setup clean

venv/bin/activate: requirements.txt
	python3 -m venv venv
	./venv/bin/pip install -q -r requirements.txt

setup: venv/bin/activate

run: setup
	@echo "Target server: http://127.0.0.1:8080/layer-demo"
	@echo "In a second terminal run: make -f Makefile run-generator"
	./venv/bin/python http_target_server.py

run-generator: setup
	./venv/bin/python traffic_generator.py

build-py: setup
	./venv/bin/python layer_builder.py

build-js:
	node layer_builder.js

clean:
	rm -rf venv __pycache__ server_out.log
