#!/usr/bin/env bash
# Module 00c -- real apt package management commands. Every command here
# is READ-ONLY or uses --simulate, so nothing on your real system actually
# changes -- see DECISIONS.md for why this course draws that line here.

echo "======================================================================"
echo "What's already installed (read-only)"
echo "======================================================================"
apt list --installed 2>/dev/null | head -5
echo "  ... (truncated -- your system likely has hundreds of packages)"

echo
echo "======================================================================"
echo "Package metadata, without installing anything"
echo "======================================================================"
apt-cache show curl 2>/dev/null | head -12

echo
echo "======================================================================"
echo "Which package owns a given file, and what files a package provides"
echo "======================================================================"
echo "  Package that owns /bin/bash:"
dpkg -S /bin/bash 2>/dev/null || dpkg -S "$(readlink -f /bin/bash)"
echo
echo "  Files the 'bash' package installs (first 5):"
dpkg -L bash 2>/dev/null | head -5

echo
echo "======================================================================"
echo "Simulating an install -- shows exactly what WOULD happen, changes nothing"
echo "======================================================================"
echo "  apt-get install --simulate -y cowsay:"
apt-get install --simulate -y cowsay 2>/dev/null | tail -8

echo
echo "======================================================================"
echo "Dependency resolution, made visible"
echo "======================================================================"
echo "  What curl depends on:"
apt-cache depends curl 2>/dev/null | head -8
echo
echo "  This dependency graph is exactly what apt/dpkg resolves automatically"
echo "  when you run a REAL install -- every package on this list gets pulled"
echo "  in too, unless already satisfied, which is why 'apt install X' can"
echo "  sometimes install a surprising number of additional packages."
