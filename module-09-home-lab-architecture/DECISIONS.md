# Design Decisions — Module 09

## Why this module is structured so differently from Modules 01-08

Every prior module's exercises were fully containable inside this course's
own tested code, running on localhost or in pure simulation. This module's
subject matter -- home network architecture -- genuinely requires touching
real hardware (or at least a real hypervisor) to be meaningful. Rather than
force a false sense of "this was tested and verified" onto something this
course cannot run (a student's specific Cox gateway model, their specific
hypervisor setup), this module is honest about that boundary the same way
Module 06 was honest about Packet Tracer: it ships tested, working code
for the parts that CAN be tested (`lab_plan_generator.py`/`.js`) and
detailed, safety-conscious written guides for the parts that can't.

## Why the virtual lab is presented as the recommended path, and production as optional

A student who only ever does the virtual lab has learned everything this
course's later modules (10-19) actually depend on: pfSense/OPNsense
navigation, VLAN configuration, firewall rule writing, seeing real
`show route`-equivalent output. Nothing in this course requires the
student's ACTUAL home network to be restructured. Framing production
bridge-mode reconfiguration as optional and clearly separated (its own
file, with its own safety checklist) means a student can get 100% of this
course's value without ever risking their household's internet
connectivity, while still having a clear, honest path forward if they want
it.

## Why cox_bridge_mode_guide.md doesn't give exact click-by-click menu paths

Cox's gateway admin UI wording and menu structure changes across
firmware versions and gateway models (Panoramic WiFi vs. older models
vs. newer ones) in ways this document can't track or verify. Giving a
specific, possibly-stale click path with false confidence would be worse
than describing the PROCESS (what bridge mode does, what to check before
and after) and directing the student to Cox's own current support
documentation for their exact model's menu wording.

## Why lab_plan_generator.py hardcodes segment host-counts instead of taking them as CLI args

Keeping the three segments (`Main`, `IoT/Guest`, `Lab`) and their default
host counts directly editable in `main()` -- rather than building a more
elaborate CLI argument parser -- matches this course's general philosophy
of keeping tools simple enough that reading and editing the source IS the
intended workflow (Exercise 1 explicitly asks the student to edit these
numbers to match their real device count). A student customizing their own
home network's plan should be comfortable opening and editing 3 lines of
Python/JS; that's a lower bar than learning a new CLI argument syntax for
a script they'll only ever run for themselves, once.

## Why the firewall rule outline is text, not actual pfSense config

Generating literal pfSense XML config or CLI commands would tie this
script to one specific firewall product's configuration format, when the
actual lesson (which directions should be allowed vs. blocked, and why) is
product-agnostic. The printed outline is deliberately written as something
a student translates by hand into whichever firewall UI they're actually
using (Exercise 3 asks for exactly this translation) -- the translation
step itself is part of learning that specific tool's rule-writing
interface, which this script can't do on the student's behalf without
knowing their exact pfSense/OPNsense version.
