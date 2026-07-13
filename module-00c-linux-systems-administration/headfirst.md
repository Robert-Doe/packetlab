# Head First: Everything in Linux Is a File, and Every File Has an Owner

## "Everything is a file" isn't a slogan. Try it.

Unix's most famous design principle — devices, processes, even kernel
state, all exposed through the same filesystem interface you already use
for documents — isn't philosophy, it's mechanism. `/proc/cpuinfo` isn't a
file someone wrote to disk; it's the kernel generating text on the fly
every time you read it, through the exact same `open()`/`read()` calls
you'd use on an ordinary document. `/dev/null` isn't a file with contents;
it's a device special file that discards everything written to it. Once
you internalize that files, devices, and running-kernel-state are all
accessed through one uniform interface, an enormous amount of "how does
Linux even work" starts making structural sense — including why so many
system administration and security tools are just... reading and writing
files.

## Permission bits are boolean algebra you already learned in Module 00a

`filesystem_and_permissions.sh` proved `chmod 755` and
`chmod u=rwx,g=rx,o=rx` produce IDENTICAL results — because they're two
notations for the same 9-bit value (3 permission trios × 3 bits each).
Read=4, write=2, execute=1 isn't an arbitrary numbering — it's straight
binary place value, exactly like Module 00a's `decimal_to_binary()`. A
permission trio of `7` (`111` in binary) means all three bits set
(read+write+execute); `5` (`101`) means read and execute but not write.
This is the SAME bit-flag pattern you'll see again in TCP's flags field
(Module 07) and in IPv4's flags field (Module 02) — a fixed number of
independent yes/no switches, packed into consecutive bits, because it's
compact and because testing "is this bit set" is a single cheap AND
operation.

**Brain power:** why does the sticky bit specifically use the OCTAL DIGIT
1 as a fourth, LEADING digit (making `/tmp`'s permissions `1777` instead
of just `777`)? Because it's a genuinely separate bit-flag from the
ordinary read/write/execute permissions — it doesn't fit into any single
owner/group/other trio, so it gets its own leading digit, extending the
same "each digit is independent bits" pattern one step further (setuid
and setgid use this same leading digit, at different bit positions within
it, for their own independent flags).

## A systemd unit file is a declaration, not a script

Notice `heartbeat.service` contains no actual logic — no loop, no
conditionals, just key-value declarations (`ExecStart=`, `Restart=`,
`WantedBy=`). This is deliberate: systemd's whole design philosophy is
declarative dependency management — YOU declare what a unit needs (`After=`,
`Requires=`) and what should run, and systemd's job is figuring out the
correct ORDER to start everything and keeping it running per your
`Restart=` policy. This is a fundamentally different model than an old-style
init script (a shell script YOU write that manually handles start/stop/status
logic) — systemd inverts control: you describe the desired end state,
the system figures out how to get there and stay there.

**Brain power:** why did `heartbeat.sh`'s `echo` output show up
automatically in `journalctl`, with zero explicit logging code written?
Because systemd, by default, captures a unit's stdout/stderr and routes
it into the journal (`journald`) automatically — this is systemd's
opinionated default specifically so ordinary programs, which were never
written with "systemd awareness," still get centralized, timestamped,
queryable logging for free, just by being run as a systemd unit instead
of a bare background process.

## Package managers are dependency graphs, made concrete

`package_management.sh`'s dependency listing for `curl` (`libc6`,
`libcurl4t64`, `zlib1g`) is a live example of exactly the kind of directed
graph structure you'll see formalized in any algorithms course — and
`apt`/`dpkg`'s entire job when you run a real install is topologically
sorting that graph (installing dependencies before the things that need
them) and detecting conflicts (two packages that can't coexist). This is
why `apt install X` can pull in a surprising cascade of packages you never
directly asked for — it's not being wasteful, it's correctly resolving a
dependency graph you only partially specified.

## Self-test before moving on

- Explain why `chmod 755` and `chmod u=rwx,g=rx,o=rx` are two notations
  for the identical operation, connecting this to Module 00a's binary
  place-value concept.
- What specifically does systemd do automatically with a unit's stdout,
  and why does this matter for a program that was never written with
  logging in mind?
- Why does installing one package sometimes install several others you
  never explicitly requested?
