#!/usr/bin/env bash
# Module 00c -- real filesystem hierarchy and permissions demonstration.
# Run on any real Linux system (WSL Ubuntu, a VM, your Module 09 lab).
# Everything here operates in a throwaway temp directory -- nothing
# touches system files.

set -e
WORKDIR=$(mktemp -d)
echo "Working in a throwaway temp directory: $WORKDIR"
cd "$WORKDIR"

echo
echo "======================================================================"
echo "The Filesystem Hierarchy Standard (FHS) -- where things actually live"
echo "======================================================================"
echo "  /etc      configuration files (system-wide, not per-user)"
echo "  /home     per-user home directories"
echo "  /var      variable data: logs (/var/log), spool queues, caches"
echo "  /usr/bin  most installed programs (NOT the same as /bin historically,"
echo "            though modern distros often symlink /bin -> /usr/bin)"
echo "  /proc     NOT a real filesystem -- a live window into kernel/process"
echo "            state, generated on the fly when you read it (try: cat /proc/cpuinfo)"
echo "  /dev      device files -- /dev/null, /dev/zero, /dev/sda (disks), etc."
echo "  /tmp      temporary files, world-writable, but see the sticky bit below"

echo
echo "======================================================================"
echo "Default permissions and umask"
echo "======================================================================"
touch testfile.txt
echo "  New file's default permissions: $(stat -c '%A (%a)' testfile.txt)"
echo "  Current umask: $(umask)"
echo "  A new regular file normally starts at 666 (rw-rw-rw-), then umask"
echo "  SUBTRACTS permission bits from that -- umask 022 removes write for"
echo "  group and other, leaving 644 (rw-r--r--), which is what you likely just saw."

echo
echo "======================================================================"
echo "chmod: octal notation IS binary place value (Module 00a's math, applied)"
echo "======================================================================"
echo "  Each permission trio (owner/group/other) is exactly 3 bits:"
echo "    read=4 (100), write=2 (010), execute=1 (001) -- sum the bits you want."
echo "  755 = rwxr-xr-x : owner=7(rwx=4+2+1) group=5(r-x=4+0+1) other=5(r-x=4+0+1)"
chmod 755 testfile.txt
echo "  After chmod 755: $(stat -c '%A (%a)' testfile.txt)"

echo
echo "  Symbolic notation says the same thing differently:"
chmod u=rwx,g=rx,o=rx testfile.txt
echo "  After chmod u=rwx,g=rx,o=rx: $(stat -c '%A (%a)' testfile.txt)"
echo "  (should be identical to the octal 755 result above)"

echo
echo "======================================================================"
echo "Execute permission actually gates execution -- proven, not asserted"
echo "======================================================================"
cat > script.sh << 'EOF'
#!/usr/bin/env bash
echo "  I actually ran!"
EOF
chmod 644 script.sh  # readable, NOT executable
echo "  Trying to run a non-executable script directly:"
if ./script.sh 2>/tmp/perm_error.txt; then
    echo "  (unexpectedly succeeded)"
else
    echo "  FAILED as expected: $(cat /tmp/perm_error.txt)"
fi
chmod +x script.sh
echo "  After chmod +x, trying again:"
./script.sh

echo
echo "======================================================================"
echo "Special bits: the sticky bit on /tmp (a real, universal example)"
echo "======================================================================"
echo "  /tmp permissions: $(stat -c '%A (%a)' /tmp)"
echo "  Notice the trailing 't' in the permission string, and the leading 1"
echo "  in the octal form (1777) -- the sticky bit. It means: even though /tmp"
echo "  is world-writable (anyone can create files there), only a file's OWNER"
echo "  (or root) can delete or rename it -- otherwise any user could delete"
echo "  files other users left in /tmp, which would be a real security problem"
echo "  on any shared multi-user system."

echo
echo "======================================================================"
echo "Cleaning up"
echo "======================================================================"
cd /
rm -rf "$WORKDIR"
echo "  Removed $WORKDIR"
