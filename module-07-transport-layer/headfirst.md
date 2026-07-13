# Head First: TCP Is a Promise. UDP Is a Postcard.

## Every socket call you've ever made was standing on a state machine

`connect()`. `send()`. `recv()`. `close()`. Four calls, and you never think
about what happens between them. But Module 07's
`tcp_state_machine.py` just showed you: every single one of those calls
triggers a real state transition, on both ends of the connection,
independently, synchronized only by the segments crossing the wire. When
you call `connect()`, you're not "opening a connection" in some abstract
sense — you're driving your local endpoint from `CLOSED` to `SYN_SENT`, and
your call doesn't even return successfully until your endpoint has heard
back enough to reach `ESTABLISHED`. The socket API's simplicity is a
facade over a genuinely intricate protocol running underneath, on your
behalf, without your code ever touching it directly.

**Brain power:** when `tcp_echo_client.py` calls `sock.close()`, which
state does the CLIENT immediately move to? `FIN_WAIT_1` — not `CLOSED`.
Closing your end of a TCP connection is a *negotiation*, not an
instruction. You're saying "I have no more data to send," and waiting for
the other side to acknowledge that AND finish whatever it was doing before
it agrees to close its own end too. That's why `CLOSE_WAIT` exists at all
— it's the state a server sits in after receiving your FIN but before its
own application has gotten around to calling `close()` itself. If you've
ever seen a server with dozens of connections stuck in `CLOSE_WAIT` in
production, that's this exact state, and it usually means the server's
application code forgot to close its end after the client hung up.

## TCP's reliability isn't magic. It's arithmetic, retried.

Every byte you send over TCP gets a sequence number. Every byte received
gets acknowledged by number. If an ACK doesn't arrive in time, the sender
just... sends it again. That's the entire trick. There's no cleverness
beyond "number everything, confirm receipt, resend what wasn't confirmed."
`tcp_echo_client.py` never wrote a single line handling retransmission,
ordering, or loss — and yet Exercise 2 asks you to go find, in a real
Wireshark capture, the exact sequence numbers proving this arithmetic is
happening on every single segment, whether you ever notice it or not.

## UDP isn't "TCP without the good parts." It's TCP's raw material.

`udp_echo_client.py` showed you datagrams vanishing with zero fanfare —
no error, no retry, just silence where a reply should have been. This
looks like a downgrade until you realize: **every reliability mechanism
TCP has is something you could build yourself, on top of UDP, if you only
needed part of it.** DNS does exactly this (Module 08) — it sends a UDP
query, waits with a timeout, and just tries again (usually to a different
server) if nothing comes back, because a full TCP handshake for a single
15-byte question would be wasteful overhead for something that fails
rarely and costs little to just retry. Real-time video/voice protocols do
something similar in the opposite direction — they'd rather drop an old,
late audio frame than have TCP dutifully retransmit and deliver it after
the moment it mattered has passed. UDP isn't the broken version of TCP.
It's the primitive TCP itself is partially built from, exposed directly
for the cases where you want to make your own reliability tradeoffs.

## Self-test before moving on

- Name the exact state a server sits in after receiving a client's FIN
  but before its own application calls `close()`. Why does this state
  need to exist at all, rather than the server just closing immediately?
- In your own words, what's the ONE thing UDP genuinely lacks that TCP
  provides — not "reliability" as a vague word, but the specific mechanism
  (numbered acknowledgment + retransmission) that produces reliability?
- Why would a real-time voice call protocol deliberately choose UDP over
  TCP, given everything you now know TCP guarantees that UDP doesn't?
