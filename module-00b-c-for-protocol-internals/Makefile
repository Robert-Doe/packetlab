# Module 00b -- requires a C compiler (gcc/clang). On Windows, use WSL:
#   wsl -d Ubuntu -- bash -c "cd /mnt/c/path/to/this/dir && make"
.PHONY: all run clean

CC = gcc
CFLAGS = -Wall

all: protocol_struct pointers_and_memory overflow_protected overflow_unprotected

protocol_struct: protocol_struct.c
	$(CC) $(CFLAGS) -o $@ $<

pointers_and_memory: pointers_and_memory.c
	$(CC) $(CFLAGS) -o $@ $<

overflow_protected: buffer_overflow_demo.c
	$(CC) $(CFLAGS) -o $@ $<

overflow_unprotected: buffer_overflow_demo.c
	$(CC) $(CFLAGS) -fno-stack-protector -o $@ $<

run: all
	@echo "=== protocol_struct ==="
	./protocol_struct
	@echo ""
	@echo "=== pointers_and_memory ==="
	./pointers_and_memory
	@echo ""
	@echo "=== overflow_protected (expect a safe abort) ==="
	-./overflow_protected
	@echo ""
	@echo "=== overflow_unprotected (expect visible corruption) ==="
	-./overflow_unprotected
	@echo ""
	@echo "NOTE: memory_safety_contrast.js is Node/JS, not C -- if you're running"
	@echo "this Makefile inside WSL (gcc lives there) and Node lives on the Windows"
	@echo "side instead, run it separately: node memory_safety_contrast.js"

clean:
	rm -f protocol_struct pointers_and_memory overflow_protected overflow_unprotected
