.PHONY: run

run:
	python3 pcap_writer.py
	python3 pcap_reader.py incident.pcap
	python3 incident_timeline.py incident.pcap
	node pcap_writer.js
	node incident_timeline.js incident_node.pcap
