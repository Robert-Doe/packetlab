# Head First: Security Groups Are Firewalls That Know Each Other's Names

## The single most important line in this module's Terraform

```hcl
ingress {
  from_port       = 8080
  to_port         = 8080
  security_groups = [aws_security_group.web.id]   # NOT cidr_blocks!
}
```

This one line is the entire reason `app-sg` produced zero findings in
`sg_rule_auditor.py`. Instead of saying "allow traffic from IP range X"
(a CIDR block — a fixed set of addresses that has to be updated by hand
whenever your infrastructure changes), it says "allow traffic from
whatever's currently in the web security group" — a LIVE reference that
stays correct automatically as instances in that group come and go, scale
up, get replaced. This is something a home NAT/firewall (Module 10) simply
can't do — a home router's rules reference IP addresses and ports, never
"whatever's plugged into VLAN 10 right now" as a first-class concept the
way a cloud security group can reference another security group directly.

**Brain power:** why does `sg_rule_auditor.py`'s `audit_security_group()`
completely skip any rule with a `source_sg` set, without even checking its
port number? Because a security-group-reference rule can only ever match
traffic from resources YOU control and have explicitly placed in that
referenced group — there's no way for an arbitrary internet host to
"become a member of web-sg" and thereby satisfy this rule. The entire
class of "is this port exposed to the whole internet" risk this auditor
checks for structurally cannot happen through a security-group reference,
regardless of which port number is involved.

## Public and private subnets: the same "who can reach the internet" question as Module 10

A public subnet has a route to an Internet Gateway; a private subnet's
only path outward goes through a NAT Gateway sitting IN a public subnet.
This might sound like new cloud-specific vocabulary, but it's exactly
Module 10's NAT/PAT concept, restated: your private-subnet instances can
initiate outbound connections (through the NAT gateway, which translates
their private addresses the same way your home router translates
192.168.x.x addresses), but nothing from the internet can initiate an
inbound connection TO them directly, because there's no route back in —
the exact same "unsolicited inbound has nowhere to go" property Module
10's Scenario 3 demonstrated, just implemented with AWS's own routing
primitives instead of a home router's NAT table.

## Why this module's Terraform couldn't be `terraform validate`-tested here

Every other module's code in this course ran and was verified for real.
This one is different because it targets infrastructure that costs real
money and requires real credentials this course will never ask for or
handle. What COULD be verified without any of that — the actual security
LOGIC of the 3-tier design, expressed as data and audited with real code
— was verified, thoroughly, including a deliberately broken example to
prove the auditor isn't just rubber-stamping everything. The Terraform
syntax itself represents careful, standard `hashicorp/aws` provider usage,
but "I wrote this carefully" and "I ran this and it worked" are different
claims, and this course tries hard never to blur that line — Step 1 of
the tutorial asks you to close that gap yourself, on your own machine,
before ever risking a cloud bill.

## Self-test before moving on

- Why does a security-group-reference rule (`security_groups = [...]`)
  structurally prevent the exact kind of "exposed to the whole internet"
  finding this module's auditor looks for, regardless of port number?
- Explain, in terms of Module 10's NAT concepts, why a private subnet's
  instances can reach the internet (via NAT Gateway) but nothing on the
  internet can reach them directly.
- Why does this course insist on you personally running
  `terraform validate` and `terraform plan` before `apply`, rather than
  asserting the configuration is definitely correct?
