.PHONY: plan

SUBNET ?= 192.168.0.0/24

plan:
	python3 lab_plan_generator.py $(SUBNET)
	node lab_plan_generator.js $(SUBNET)
