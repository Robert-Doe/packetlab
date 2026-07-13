/**
 * Module 00b — the JS/Node contrast piece for buffer_overflow_demo.c.
 * Not a "port" (JS has no raw pointers or manual memory layout to port),
 * but a direct answer to the question buffer_overflow_demo.c raises:
 * what happens in a memory-safe language when you try the same "write
 * more than fits" operation?
 *
 * Confirmed during this module's testing: two DIFFERENT safe behaviors,
 * neither of which is "silently corrupt adjacent memory."
 */

function demonstrateBufferTruncation() {
  console.log("=== Buffer.write() -- silently truncates, never overflows ===");
  const buf = Buffer.alloc(8);
  const bytesWritten = buf.write("0123456789ABCDEF", 0, "utf8");
  console.log(`  Tried to write 16 characters into an 8-byte buffer.`);
  console.log(`  bytesWritten reported: ${bytesWritten} (only what actually fit)`);
  console.log(`  buffer contents: "${buf.toString()}"`);
  console.log(`  buffer.length is STILL exactly 8: ${buf.length === 8}`);
  console.log("  No adjacent memory was touched. The extra bytes were simply never written --");
  console.log("  Node's runtime enforces the buffer's bounds itself, unlike C's strcpy().");
}

function demonstrateTypedArrayThrows() {
  console.log("\n=== Uint8Array.set() -- throws instead of truncating ===");
  const arr = new Uint8Array(4);
  console.log("  Trying to .set() 8 bytes into a 4-byte Uint8Array...");
  try {
    arr.set([1, 2, 3, 4, 5, 6, 7, 8]);
    console.log("  (this line should never print)");
  } catch (e) {
    console.log(`  Threw: ${e.constructor.name}: ${e.message}`);
    console.log("  A DIFFERENT safe behavior than Buffer.write()'s silent truncation --");
    console.log("  but still safe: the program is stopped with a catchable exception,");
    console.log("  never left to silently corrupt whatever memory happened to be next.");
  }
}

function main() {
  demonstrateBufferTruncation();
  demonstrateTypedArrayThrows();

  console.log("\n=== The actual comparison to buffer_overflow_demo.c ===");
  console.log("C's strcpy() has NO IDEA how big the destination buffer is -- it just");
  console.log("keeps copying bytes until it hits a null terminator in the SOURCE,");
  console.log("wherever that happens to be. Every bounds check in this file's two");
  console.log("examples happened because JS's runtime tracks each buffer's length");
  console.log("internally and checks it on every operation -- a runtime guarantee");
  console.log("C's standard library functions (by design, for raw performance) do not provide.");
}

main();
