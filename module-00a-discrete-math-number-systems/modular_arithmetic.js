/**
 * Module 00a — JS/Node port of modular_arithmetic.py. Same fast modular
 * exponentiation, same real toy Diffie-Hellman exchange.
 */

function modExp(base, exponent, modulus) {
  let result = 1;
  base = base % modulus;
  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result = (result * base) % modulus;
    }
    exponent = Math.floor(exponent / 2);
    base = (base * base) % modulus;
  }
  return result;
}

function naiveModExp(base, exponent, modulus) {
  // Using BigInt here, not Math.pow: a regular JS `number` is a 64-bit
  // float with only ~15-17 significant decimal digits of precision.
  // base**exponent for these test ranges (up to ~1000**40, a 120-digit
  // number) blows past that instantly, so Math.pow silently returns a
  // garbage approximation instead of throwing -- confirmed the hard way
  // during this module's own testing (46 of 50 trials "mismatched"
  // against the exact fast method before this fix). BigInt gives exact,
  // arbitrary-precision integer arithmetic, matching what Python's ints
  // do natively.
  return Number((BigInt(base) ** BigInt(exponent)) % BigInt(modulus));
}

function clockArithmeticDemo() {
  console.log("Clock arithmetic IS modular arithmetic:");
  console.log("  If it's 9 o'clock and 5 hours pass, it's not '14 o'clock' -- it's 2 o'clock.");
  console.log(`  (9 + 5) mod 12 = ${(9 + 5) % 12}`);
  console.log("  Every 'wraps back to zero after N' behavior in networking is exactly this:");
  console.log(`  TCP sequence numbers wrap mod 2^32 = ${Math.pow(2, 32)}`);
  console.log("  A TTL of 1, decremented past 0, would wrap mod 256 if nothing stopped it " +
    "(real routers instead DROP the packet at TTL=0 -- see Module 05's traceroute mechanics)");
}

function diffieHellmanDemo() {
  console.log("Diffie-Hellman key exchange -- real math, small (INSECURE) numbers for clarity");
  console.log();

  const p = 23;
  const g = 5;
  console.log(`  Public parameters (anyone may know these): p=${p}, g=${g}`);

  const alicePrivate = 6;
  const bobPrivate = 15;
  console.log(`  Alice's private number (never sent): ${alicePrivate}`);
  console.log(`  Bob's private number (never sent):   ${bobPrivate}`);

  const alicePublic = modExp(g, alicePrivate, p);
  const bobPublic = modExp(g, bobPrivate, p);
  console.log(`\n  Alice computes and SENDS: g^a mod p = ${g}^${alicePrivate} mod ${p} = ${alicePublic}`);
  console.log(`  Bob computes and SENDS:   g^b mod p = ${g}^${bobPrivate} mod ${p} = ${bobPublic}`);
  console.log("  (An eavesdropper now knows p, g, alice_public, bob_public -- but NOT either private number.)");

  const aliceShared = modExp(bobPublic, alicePrivate, p);
  const bobShared = modExp(alicePublic, bobPrivate, p);
  console.log(`\n  Alice computes: bob_public^a mod p = ${bobPublic}^${alicePrivate} mod ${p} = ${aliceShared}`);
  console.log(`  Bob computes:   alice_public^b mod p = ${alicePublic}^${bobPrivate} mod ${p} = ${bobShared}`);

  console.log(`\n  Shared secret match: ${aliceShared === bobShared}`);
  console.log("  Both sides arrived at the SAME number, having never transmitted either");
  console.log("  private number OR the shared secret itself. This is the exact mathematical");
  console.log("  trick (modular exponentiation is easy forward, hard to reverse without the");
  console.log("  private exponent) underneath every TLS handshake's key exchange step.");
  return aliceShared === bobShared;
}

function main() {
  clockArithmeticDemo();

  console.log();
  console.log("=".repeat(70));
  console.log("Fast modular exponentiation, verified against the naive method");
  console.log("=".repeat(70));
  let mismatches = 0;
  for (let i = 0; i < 50; i++) {
    const base = Math.floor(Math.random() * 998) + 2;
    const exp = Math.floor(Math.random() * 38) + 2; // kept small -- naive method uses Math.pow, which overflows double precision fast
    const mod = Math.floor(Math.random() * 9998) + 2;
    const fast = modExp(base, exp, mod);
    const naive = naiveModExp(base, exp, mod);
    if (fast !== naive) {
      mismatches++;
      console.log(`  MISMATCH: ${base}^${exp} mod ${mod}: fast=${fast} naive=${naive}`);
    }
  }
  console.log(`  ${50 - mismatches}/50 trials matched between fast and naive methods.`);
  console.log(`  Example: 7^128 mod 13 = ${modExp(7, 128, 13)} (the naive method would overflow a double long before this)`);

  console.log();
  console.log("=".repeat(70));
  diffieHellmanDemo();
}

main();
