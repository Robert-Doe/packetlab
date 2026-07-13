# Capstone Project Brief

You've built 18 modules' worth of real, tested tools and real, verified
mechanisms. This project asks you to combine them into one coherent
network you design, build, attack, defend, and document — end to end.

## The deliverable

A segmented home lab (virtual, per Module 09) with:

1. **A designed and enforced network** (Modules 04, 05, 09, 10)
   - A VLSM-planned segmentation (`lab_plan_generator.py` from Module 09,
     or your own extension of it)
   - At least 2 isolated segments with a real, working firewall rule
     enforcing the isolation (verified with an actual ping test, not just
     asserted)
   - A static or dynamic routing setup connecting them (Module 05)

2. **Active monitoring** (Modules 14, 15)
   - At least 2 detector types running against real or synthetic traffic
     in your lab (port scan + beaconing, minimum)
   - A SIEM pipeline (real ELK+Grafana from Module 15, or your own
     extension) with at least one dashboard showing real findings

3. **A vulnerability assessment of your own lab** (Module 16)
   - A real scan of your own lab VMs (nmap, or this course's own
     `tcp_connect_scanner.py` extended beyond localhost — against YOUR
     OWN lab only, never anything else)
   - At least one real finding, and a remediation you actually applied
     (not just documented as "should fix")

4. **A red-team/blue-team exercise against your own lab** (see
   `red_team_blue_team_playbook.md`)
   - Simulate an incident (you can reuse and extend Module 18's
     `pcap_writer.py` approach, or generate real traffic against your own
     vulnerable lab VM)
   - Detect it with your monitoring (step 2)
   - Reconstruct it forensically (Module 18's approach) even if you
     watched it happen live — reconstructing from evidence alone is the
     actual skill being tested, not memory of what you did

5. **A written incident report** (Module 18's actual deliverable, not just
   a technical timeline) — see `final_report_template.md`

## Validate your own completeness before calling it done

```
cd module-19-capstone
python capstone_checker.py your_manifest.json
```

Fill in a manifest matching `sample_manifest_complete.json`'s shape,
describing what you actually built. The checker validates INTERNAL
CONSISTENCY — do your firewall rules actually match your isolation plan,
is every vulnerability finding actually remediated, is your report
substantial enough to stand alone — not subjective quality. Getting to
100% here is a floor, not a ceiling.

## What "done" actually looks like

- `capstone_checker.py` reports 100% completeness against your own manifest
- You can explain, live, without notes, every design decision in your
  network using the vocabulary this course built (longest-prefix match,
  stateful connection tracking, VLAN broadcast domains, PKI trust chains
  — whatever's relevant to your specific build)
- Your incident report could be handed to someone who wasn't there and
  they'd understand what happened, in what order, and why you believe it
