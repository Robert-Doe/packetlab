# Design Decisions — Module 17

## Why this module never creates or touches a real cloud account

Creating accounts, entering payment/billing information, and provisioning
real infrastructure that can incur real costs are all explicitly out of
scope for anything this course's tooling does on a student's behalf. This
is not a scope limitation specific to this module -- it's a hard boundary
that applies throughout: `terraform apply` against a real AWS account is
listed in `tutorial.html` as something the STUDENT runs, with their own
credentials, after reviewing the plan output themselves.

## Why terraform/main.tf wasn't run through terraform validate during this build

Neither the Terraform CLI nor a standalone HCL parser (a `python-hcl2`
install was attempted and did not succeed in this build environment) was
available to validate the configuration's syntax independently of
applying it against real AWS infrastructure -- which this course will
never do (see above). The configuration was written carefully against
well-established `hashicorp/aws` provider resource syntax (the same
`aws_vpc`/`aws_subnet`/`aws_security_group`/`aws_lb` resource types and
argument names used throughout the provider's own documentation and
widely-published examples), but this course is explicit that "written
carefully" is not the same claim as "verified to work," and
`tutorial.html`'s Step 1 asks the student to run `terraform validate`
and `terraform plan` themselves before trusting or applying it.

## Why sg_rule_auditor.py models the Terraform's security groups as separate JSON rather than parsing main.tf directly

Parsing real HCL to extract security group rules would require exactly
the HCL parser this build environment didn't have working. Modeling the
same 3-tier design as an independent JSON/dict structure keeps the
auditor's logic testable on its own merits (confirmed working, including
against a deliberately broken example) without depending on a working HCL
toolchain. Exercise 2 (extending the audit to include a 4th tier)
explicitly asks the student to keep BOTH representations (the Terraform
and the auditor's JSON model) in sync by hand -- a real, if manual,
parallel to how infrastructure-as-code and its own security reviews often
need to be kept consistent through disciplined process rather than
automatic derivation.

## Why the sensitive-ports list is hardcoded rather than pulled from a public database

A short, well-known list (SSH, RDP, and several common database/service
ports) covers the overwhelming majority of "this should never be
0.0.0.0/0" real-world misconfigurations that show up in actual cloud
security audits and tools like AWS Security Hub or Prowler. A
comprehensive, externally-sourced port database would add real value in
production tooling but would be disproportionate for a module whose job is
teaching the AUDITING TECHNIQUE (wide-open CIDR + sensitive port =
finding; security-group-reference = never flagged) rather than shipping a
production-grade scanner. Exercise 1 (adding egress checks) and general
extension of `SENSITIVE_PORTS` are natural next steps for a student who
wants to grow this into something more comprehensive.

## Why a deliberately misconfigured security group is included in the sample data

Testing an auditor only against configurations that SHOULD pass risks
never confirming it can actually catch anything -- a detector that always
says "fine" is indistinguishable from a broken one until you feed it
something that should fail. `db-sg-MISCONFIGURED-example` exists
specifically to prove `sg_rule_auditor.py` produces real findings when
warranted, not just clean reports, confirmed during this module's testing
(2 findings, both correct, both absent from the real 3-tier design's
results).
