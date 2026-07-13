# Module 21 -- the CTF challenge needs a C compiler. On Windows, use WSL:
#   wsl -d Ubuntu -- bash -c "cd /mnt/c/path/to/this/dir && make"
.PHONY: all solve checkers clean

CC = gcc
CFLAGS = -O0

all: ctf_challenge/crackme

ctf_challenge/crackme: ctf_challenge/crackme.c
	$(CC) $(CFLAGS) -o $@ $<

solve: all
	@echo "=== solving crackme (Python) ==="
	python3 ctf_challenge/solve_crackme.py ctf_challenge/crackme --verify

checkers:
	@echo "=== research_notes_checker.py (complete sample) ==="
	python3 research_notes_checker.py sample_research_log_complete.json
	@echo ""
	@echo "=== research_notes_checker.py (incomplete sample) ==="
	python3 research_notes_checker.py sample_research_log_incomplete.json
	@echo ""
	@echo "=== disclosure_timeline_checker.py (complete sample) ==="
	python3 disclosure_timeline_checker.py sample_disclosure_complete.json
	@echo ""
	@echo "=== disclosure_timeline_checker.py (incomplete sample) ==="
	python3 disclosure_timeline_checker.py sample_disclosure_incomplete.json

clean:
	rm -f ctf_challenge/crackme
