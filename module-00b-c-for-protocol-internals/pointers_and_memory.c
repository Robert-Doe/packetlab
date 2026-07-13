/*
 * Module 00b -- pointers and memory, the C concepts every raw socket API
 * (recv(), memcpy(), the struct casting protocol_struct.c just did)
 * depends on. Python and JS both hide this layer from you entirely --
 * this file makes it visible.
 *
 * Compile and run:
 *   gcc -Wall -o pointers_and_memory pointers_and_memory.c
 *   ./pointers_and_memory
 */
#include <stdio.h>
#include <string.h>

void demonstrate_pointer_basics(void) {
    int x = 42;
    int *ptr = &x;  /* ptr now HOLDS THE ADDRESS of x, not the value 42 */

    printf("x = %d\n", x);
    printf("&x (address of x) = %p\n", (void *)&x);
    printf("ptr = %p  (same address, confirmed: %s)\n", (void *)ptr,
           (void *)ptr == (void *)&x ? "yes" : "no");
    printf("*ptr (dereference -- follow the pointer to the value) = %d\n", *ptr);

    *ptr = 100;  /* modifying THROUGH the pointer changes the original x */
    printf("after *ptr = 100, x is now: %d\n", x);
}

void demonstrate_arrays_are_pointers(void) {
    int numbers[5] = {10, 20, 30, 40, 50};

    printf("\nnumbers[2] = %d\n", numbers[2]);
    printf("*(numbers + 2) = %d  (array indexing IS pointer arithmetic --\n", *(numbers + 2));
    printf("  numbers[i] is literally defined as *(numbers + i))\n");

    printf("sizeof(int) = %zu bytes\n", sizeof(int));
    printf("&numbers[0] = %p\n", (void *)&numbers[0]);
    printf("&numbers[1] = %p  (exactly %zu bytes later)\n", (void *)&numbers[1], sizeof(int));
}

/* This is what recv()/recvfrom() do: they take a pointer to a buffer YOU
 * own, and write bytes INTO it -- the function itself never allocates or
 * returns a new buffer, it fills the one you handed it. */
void simulate_recv_into_buffer(unsigned char *buffer, size_t buffer_len) {
    const unsigned char fake_packet[] = {0xde, 0xad, 0xbe, 0xef};
    size_t to_copy = sizeof(fake_packet) < buffer_len ? sizeof(fake_packet) : buffer_len;
    memcpy(buffer, fake_packet, to_copy);
}

void demonstrate_buffer_passing(void) {
    unsigned char my_buffer[16] = {0};  /* the caller OWNS this memory */

    printf("\nBuffer before simulate_recv_into_buffer(): ");
    for (int i = 0; i < 8; i++) printf("%02x ", my_buffer[i]);
    printf("\n");

    simulate_recv_into_buffer(my_buffer, sizeof(my_buffer));

    printf("Buffer after simulate_recv_into_buffer():  ");
    for (int i = 0; i < 8; i++) printf("%02x ", my_buffer[i]);
    printf("\n");
    printf("The function never returned a new buffer -- it wrote directly\n");
    printf("into memory the CALLER already owned, via the pointer it was given.\n");
    printf("This is exactly the pattern C's recv(int sockfd, void *buf, size_t len, ...) uses.\n");
}

int main(void) {
    demonstrate_pointer_basics();
    demonstrate_arrays_are_pointers();
    demonstrate_buffer_passing();
    return 0;
}
