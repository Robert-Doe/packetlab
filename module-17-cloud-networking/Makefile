.PHONY: audit tf-validate

audit:
	python3 sg_rule_auditor.py
	node sg_rule_auditor.js

tf-validate:
	cd terraform && terraform init && terraform validate && terraform plan
