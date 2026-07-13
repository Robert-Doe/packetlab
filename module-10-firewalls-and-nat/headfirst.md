# Head First: Your Firewall Doesn't Ask "Is This Bad?" — It Asks "Did I See This Leave?"

## The default-deny model, restated as a memory problem

A stateful firewall's core trick isn't cleverness about which traffic is
dangerous — it's memory. Every outbound connection your network makes gets
written down (Scenario 1: the moment `192.168.1.10` sent that first packet
to `93.184.216.34:443`, an entry appeared in both the NAT table and the
connection-state table). Every INBOUND packet then gets one question
asked of it: **does this match something already written down?** If yes,
it's obviously a reply to something you asked for — let it through. If no
— nobody wrote it down because nobody here ever asked for it — drop it. No
inspection of payload, no judgment about intent, no "this looks
suspicious." Just: is this in the book, or not.

**Brain power:** Scenario 4 fed the firewall a packet with the RIGHT
external port (40000, a real entry) but the WRONG source IP (an attacker's
address instead of the real web server's). Why does the firewall reject
this instead of happily forwarding it, since the port number matches a
real entry? Because "did I see this leave" isn't just about the port — the
full connection tuple (internal ip:port, external ip:port, AND the remote
peer's ip:port) has to match. A NAT table entry existing for port 40000
only means "SOMETHING is allowed to reply on this port" — it specifically
means "the host at 93.184.216.34:443 is allowed to reply," and nobody else.

## PAT is the reason your public IP is a shared resource, not a personal one

You have exactly one public IP for your entire household (check it —
whatismyip-style sites, or your router's WAN status page). Every device in
your house — laptop, phone, smart TV, game console — shares that one
address for every simultaneous internet connection they make, and the only
thing keeping their traffic from colliding is the external PORT number your
router assigns per connection. Scenario 1 showed this concretely: two
different internal IPs, coincidentally using the identical internal port,
got assigned DIFFERENT external ports specifically so their return traffic
wouldn't collide. This is why IPv4 address exhaustion (there are only ~4.3
billion IPv4 addresses, and vastly more devices than that exist) never
actually stopped the internet from growing — PAT lets millions of
households each represent potentially dozens of devices behind a single
public address, multiplying effective address space by roughly "however
many ports you're willing to juggle" (about 64,000 per external IP).

## "Just forward the port" is you personally overriding the default-deny rule

Port forwarding isn't a separate feature bolted onto NAT — it's you
manually inserting a permanent entry into the exact same tables Scenario
1-4 showed being built and checked automatically. A normal connection's
NAT/state entries get created reactively (the moment your device sends
outbound traffic) and could be thought of as temporary. A port forward is
you saying, in advance, "create this entry permanently, regardless of
whether anyone inside ever sends anything out first." That's a real
security tradeoff, not a free feature — it's you personally authorizing
exactly the behavior Scenario 3 demonstrated being blocked by default,
for one specific port, forever (until you remove the rule).

## Self-test before moving on

- In your own words: what specific piece of information does the firewall
  check to decide whether Scenario 4's packet is legitimate, beyond just
  "is this port in the NAT table"?
- Why does a household with one public IPv4 address not run out of usable
  simultaneous connections almost immediately, given how few public IPs
  exist compared to devices?
- What EXACTLY does enabling port forwarding change about your firewall's
  default behavior, stated precisely (not "it opens a port" — which table
  entry does it create, and when)?
