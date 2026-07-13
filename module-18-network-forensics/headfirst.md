# Head First: Evidence Doesn't Explain Itself — You Reconstruct the Story

## A .pcap file is just Module 02's frames, saved to disk with timestamps

Every technique this module needed was already in your hands. Module 02
taught you Ethernet/IP/TCP headers are just struct-packed bytes. This
module adds exactly one new idea: wrap each frame in a 16-byte record
header (timestamp + length) and prefix the whole file with a 24-byte
global header (magic number + version + link type), and you have a real,
industry-standard capture file. `pcap_writer.py` isn't using a special
forensics-specific technique — it's Module 02's exact frame-building
approach, saved instead of printed, with a couple of bookkeeping fields
wrapped around each one.

**Brain power:** why does the pcap format's global header include a
"magic number" (`0xA1B2C3D4`) at all, rather than just starting straight
into the version fields? Because a magic number lets any reader
(Wireshark, tcpdump, this module's own `pcap_reader.py`) instantly
distinguish "this is a pcap file" from "this is some other kind of file
entirely" — and, cleverly, the SPECIFIC value read (whether it matches
`0xA1B2C3D4` or its byte-swapped twin `0xD4C3B2A1`) tells the reader
whether the rest of the file was written in big-endian or little-endian
byte order, without needing any out-of-band information at all. One
4-byte field is doing double duty: "yes, this is pcap" AND "here's how to
interpret everything that follows."

## Detection and forensics are the same math, running in different directions

Notice `incident_timeline.py` imports nothing new — its
`detect_recon`/`detect_exfiltration` functions are structurally identical
to Module 14's `detect_port_scans`/beaconing-adjacent logic. The only real
difference is WHEN the analysis happens: Module 14 ran its logic against a
live (or freshly-generated) log, deciding "is this happening right now."
This module runs the identical statistical reasoning against a file
someone handed you AFTER the fact, deciding "what happened, and in what
order." Live detection and forensic reconstruction aren't different
disciplines requiring different tools — they're the same analytical
technique, aimed either forward (catch it happening) or backward
(reconstruct what already happened).

## The independent `file` command validated something this course couldn't claim on its own

Every other module's "this really works" claim in this course came from
this course's OWN test code confirming its OWN output. Step 1 of this
module is different: the `file` command-line utility — a completely
independent, decades-old Unix tool with zero knowledge of this course,
using its own built-in libmagic signature database — looked at
`incident.pcap` and correctly identified it as a genuine pcap capture
file, version 2.4, Ethernet link type, big-endian. That's a stronger
claim than "my own test passed" — it's "a tool that has never seen my
code, and has its own independent understanding of what a valid pcap file
looks like, agrees this is one."

## Self-test before moving on

- Explain what a pcap file's magic number accomplishes — both things it
  communicates to a reader, in one field.
- Why are `detect_recon()`/`detect_exfiltration()` essentially the same
  code as Module 14's detectors, despite this module being framed as
  "forensics" rather than "monitoring"?
- Why does an independent tool (like `file`) correctly recognizing your
  generated pcap file count as stronger evidence of correctness than your
  own script successfully reading back its own output?
