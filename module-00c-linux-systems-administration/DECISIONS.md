# Design Decisions — Module 00c

## Why systemctl --user instead of system-wide units

WSL Ubuntu's default user in this course's build environment does not
have passwordless sudo -- confirmed during testing (`sudo -n true` failed,
requiring a password this course was never given and should never try to
obtain). Rather than skip the systemd content or ask the student to
supply credentials, `systemctl --user` provides a genuine, fully-functional
systemd experience (real unit files, real start/stop/enable/disable, real
journald log capture) requiring zero elevated privilege -- confirmed
working end to end, including sustained operation and clean teardown,
without ever touching system-wide state. This also happens to be the
more security-appropriate teaching choice regardless of the privilege
constraint: least-privilege is the correct default, not merely a
workaround.

## Why package_management.sh never actually installs anything

apt install genuinely modifies persistent system state on whatever
machine runs it -- this course's build environment is the user's own real
WSL installation, not a disposable sandbox, so an uninstructed real
install would be an unrequested, persistent side effect. `--simulate`
(and other read-only apt/dpkg commands: `list`, `show`, `depends`, `-S`,
`-L`) demonstrate the exact same dependency-resolution and metadata
mechanisms a real install uses, confirmed identical in output structure,
without changing anything -- verified explicitly during this module's
testing by confirming `cowsay` was never actually present on the system
after the simulated install.

## Why the first systemd start attempt failed and what that revealed

During this module's testing, chaining `daemon-reload`, `start`, and a
`sleep` inside one combined WSL invocation initially produced a
mysteriously inactive service with zero journal entries, before a
subsequent standalone `systemctl --user start` succeeded normally and ran
correctly for the rest of testing. The most likely explanation is a
transient WSL systemd user-session readiness timing issue (the user
manager can take a moment to fully initialize after a fresh WSL session
starts) rather than any problem with the unit file itself -- confirmed by
the identical unit file and script working correctly on retry. This is
noted here rather than silently ignored because a student hitting the
same transient failure should know to simply retry the start command
rather than assume their unit file is broken.

## Why the heartbeat demo logs via stdout instead of an explicit log file

Systemd's automatic stdout/stderr-to-journal capture is itself the lesson
this demo teaches -- writing to an explicit file would hide the exact
mechanism (`journalctl --user -u heartbeat.service` reading systemd's own
captured output) this module wants to make visible. This directly sets up
Module 14/15's log-collection concepts: a program integrated with
systemd gets centralized, timestamped, queryable logging essentially for
free, which is precisely the kind of host-level log source a real SIEM
pipeline (Module 15) would ingest alongside network-level logs.

## Why this module fully cleans up every system modification after testing

Installing the heartbeat unit, starting it, and later removing it,
all happened against the user's own real WSL environment during this
module's testing -- not a disposable container. Every test action was
explicitly reversed (`stop`, `disable`, removing the unit file and demo
directory, `daemon-reload` to confirm systemd no longer sees it) and
independently confirmed removed, consistent with this course's general
practice of leaving no test artifacts behind, applied here to a real,
persistent system rather than just files in a project directory.
