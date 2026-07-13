.PHONY: run static protocols

run: static protocols

static:
	@echo "=== Static routing / longest-prefix-match trace ==="
	python3 static_routing.py
	@echo ""
	node static_routing.js

protocols:
	@echo "=== RIP (distance-vector) vs OSPF (link-state) ==="
	python3 routing_protocols_sim.py
	@echo ""
	node routing_protocols_sim.js
