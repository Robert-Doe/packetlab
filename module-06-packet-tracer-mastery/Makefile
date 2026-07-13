.PHONY: validate

validate:
	@echo "=== Topology 2 ==="
	python3 topology_validator.py topology_configs/topology2_two_lans_one_hop.json
	node topology_validator.js topology_configs/topology2_two_lans_one_hop.json
	@echo "=== Topology 3 ==="
	python3 topology_validator.py topology_configs/topology3_three_router_chain.json
	node topology_validator.js topology_configs/topology3_three_router_chain.json
