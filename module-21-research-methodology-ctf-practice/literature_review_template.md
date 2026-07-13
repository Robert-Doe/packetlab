# Literature Review / Research Log Template

Fill this in with your OWN research question -- for comprehensive exam
prep, this can be a real open question in an area this course touched
(e.g., "does jitter-ratio beaconing detection generalize to jittered/
randomized-interval C2 traffic?") or a topic your actual PhD work
concerns. Once filled in, save as JSON matching
`sample_research_log_complete.json`'s shape and run:

```
python research_notes_checker.py your_log.json
```

## 1. Research question

State it as an actual QUESTION, specific enough to be falsifiable —
not a topic name. "Network security monitoring" is a topic.
"Does a fixed detection threshold for beaconing jitter-ratio produce a
significantly higher false-positive rate against consumer IoT traffic
than against typical desktop/laptop traffic?" is a question.

## 2. Related work

For each prior source (paper, RFC, standard, well-documented tool),
record:
- **Citation** — enough to find it again (title, author/org, year)
- **Relevance** — specifically HOW it relates to your question: does it
  propose a technique you're extending, a baseline you're comparing
  against, a gap you're filling, or a claim you're testing?

A literature review's actual job is not "list things you read" — it's
"situate your question relative to what's already known," so every
entry needs to answer "so what?"

## 3. Methodology

- **Description**: what you actually did or plan to do, in enough
  detail that someone else could reproduce it. Vague verbs ("analyzed,"
  "investigated") without specifics ("computed X over Y using Z's
  formula from Module N") don't meet this bar.
- **Ethics/authorization statement**: for ANY security research
  touching real systems, state explicitly what you had authorization to
  do, and to what scope. Even for a purely synthetic/simulated study
  (like this course's own detection-logic testing), state that
  explicitly too — "no real systems or third-party data were involved"
  is itself a meaningful ethics statement.

## 4. Results

- **Summary**: your actual finding, stated as a claim.
- **Evidence**: what specifically supports the claim — data, a
  reproducible experiment's output, packet captures, code you ran and
  its results. An unsupported claim is not a finding (Module 18's own
  evidence-to-narrative standard, applied to research instead of
  incident response).

## 5. Limitations

Every real study has some. Common categories worth considering
honestly:
- **External validity** — does a synthetic/lab result generalize to
  real-world conditions?
- **Scope** — what did you deliberately NOT test?
- **Sample size / statistical power** — how many trials, how confident
  can you actually be?
- **Threats to the methodology itself** — could your own measurement
  approach have introduced bias?

A comprehensive exam committee will ask about limitations whether or not
you volunteer them — stating them yourself, precisely, is a sign of
rigor, not weakness.
