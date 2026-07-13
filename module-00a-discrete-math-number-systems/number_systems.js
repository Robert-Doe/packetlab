/**
 * Module 00a — JS/Node port of number_systems.py. Same hand-rolled base
 * conversion algorithms, same subnet-mask-is-AND and XOR demonstrations.
 */

function decimalToBinary(n) {
  if (n === 0) return "0";
  const digits = [];
  while (n > 0) {
    digits.push(String(n % 2));
    n = Math.floor(n / 2);
  }
  return digits.reverse().join("");
}

function binaryToDecimal(b) {
  let total = 0;
  const reversed = [...b].reverse();
  for (let i = 0; i < reversed.length; i++) {
    total += Number(reversed[i]) * Math.pow(2, i);
  }
  return total;
}

function decimalToHex(n) {
  if (n === 0) return "0";
  const digits = "0123456789abcdef";
  const result = [];
  while (n > 0) {
    result.push(digits[n % 16]);
    n = Math.floor(n / 16);
  }
  return result.reverse().join("");
}

function hexToDecimal(h) {
  const digits = "0123456789abcdef";
  let total = 0;
  for (const char of h.toLowerCase()) {
    total = total * 16 + digits.indexOf(char);
  }
  return total;
}

function binaryToHexByGrouping(b) {
  const padLength = Math.ceil(b.length / 4) * 4;
  const padded = b.padStart(padLength, "0");
  const groups = [];
  for (let i = 0; i < padded.length; i += 4) groups.push(padded.slice(i, i + 4));
  return groups.map((g) => decimalToHex(binaryToDecimal(g))).join("");
}

function showSubnetMaskAsAnd(ipOctet, maskOctet) {
  const ipBin = decimalToBinary(ipOctet).padStart(8, "0");
  const maskBin = decimalToBinary(maskOctet).padStart(8, "0");
  const result = ipOctet & maskOctet;
  const resultBin = decimalToBinary(result).padStart(8, "0");
  console.log(`    IP octet:    ${ipBin}  (${ipOctet})`);
  console.log(`    Mask octet:  ${maskBin}  (${maskOctet})`);
  console.log(`    AND result:  ${resultBin}  (${result})`);
}

function selfTest() {
  let mismatches = 0;
  for (let i = 0; i < 200; i++) {
    const n = Math.floor(Math.random() * 100000);
    if (decimalToBinary(n) !== n.toString(2)) {
      console.log(`MISMATCH (dec->bin) at n=${n}`);
      mismatches++;
    }
    if (decimalToHex(n) !== n.toString(16)) {
      console.log(`MISMATCH (dec->hex) at n=${n}`);
      mismatches++;
    }
    if (binaryToDecimal(n.toString(2)) !== n) {
      console.log(`MISMATCH (bin->dec) at n=${n}`);
      mismatches++;
    }
    if (hexToDecimal(n.toString(16)) !== n) {
      console.log(`MISMATCH (hex->dec) at n=${n}`);
      mismatches++;
    }
    if (hexToDecimal(binaryToHexByGrouping(n.toString(2))) !== n) {
      console.log(`MISMATCH (grouping) at n=${n}`);
      mismatches++;
    }
  }
  console.log(`Self-test: ${200 - mismatches}/200 trials matched JS's built-ins.`);
  return mismatches === 0;
}

function main() {
  console.log("=".repeat(70));
  console.log("Base conversions, by hand");
  console.log("=".repeat(70));
  for (const n of [10, 255, 192, 65535]) {
    const b = decimalToBinary(n);
    const h = decimalToHex(n);
    console.log(`  ${String(n).padStart(6)} decimal = ${b.padStart(16)} binary = 0x${h} hex`);
  }

  console.log();
  console.log("=".repeat(70));
  console.log("The 4-bits-per-hex-digit shortcut (why network engineers skip decimal)");
  console.log("=".repeat(70));
  for (const b of ["11111111", "11000000", "10101010"]) {
    const h = binaryToHexByGrouping(b);
    const grouped = [b.slice(0, 4), b.slice(4, 8)].join(" ");
    console.log(`  binary ${b} -> hex ${h}  (grouped: ${grouped})`);
  }

  console.log();
  console.log("=".repeat(70));
  console.log("Subnet masking IS bitwise AND -- Module 04's entire mechanism, one octet at a time");
  console.log("=".repeat(70));
  console.log("  192.168.1.69 AND 255.255.255.192 (a /26 mask), last octet:");
  showSubnetMaskAsAnd(69, 192);

  console.log();
  console.log("=".repeat(70));
  console.log("XOR: the 'differences only' operator (checksums, one-time pads, CRC)");
  console.log("=".repeat(70));
  const a = 0b10110101, b = 0b11010011;
  console.log(`  ${decimalToBinary(a).padStart(8, "0")} XOR`);
  console.log(`  ${decimalToBinary(b).padStart(8, "0")}`);
  console.log(`  ${"-".repeat(8)}`);
  console.log(`  ${decimalToBinary(a ^ b).padStart(8, "0")}  <- a 1 wherever the bits DIFFER, 0 wherever they match`);

  console.log();
  console.log("=".repeat(70));
  console.log("Self-test against JS's built-ins");
  console.log("=".repeat(70));
  selfTest();
}

main();
