.PHONY: ship validate-compose up down

ship:
	python3 log_shipper.py
	node log_shipper.js

validate-compose:
	docker compose config >/dev/null && echo "OK" || echo "FAILED"

up:
	docker compose up -d

down:
	docker compose down -v
