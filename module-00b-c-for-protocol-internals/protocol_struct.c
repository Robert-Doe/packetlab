/*
 * Module 00b -- the exact same Ethernet+IP+TCP header layout Module 02's
 * layer_builder.py built with struct.pack, this time in real C, using
 * real structs. This is what struct.pack/Buffer were doing UNDER THE
 * HOOD all along: laying bytes into specific memory offsets according to
 * a fixed layout.
 *
 * Compile and run (from WSL or any Linux/gcc environment):
 *   gcc -o protocol_struct protocol_struct.c
 *   ./protocol_struct
 */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <arpa/inet.h>  /* htons/htonl -- host-to-network byte order conversion */

/* __attribute__((packed)) tells the compiler NOT to insert padding bytes
 * between fields to align them to convenient boundaries (which it would
 * do by default for performance). Networking protocols define EXACT byte
 * layouts with no padding, so packed structs are required to match them. */
struct __attribute__((packed)) ethernet_header {
    uint8_t  dst_mac[6];
    uint8_t  src_mac[6];
    uint16_t ethertype;   /* network byte order */
};

struct __attribute__((packed)) ipv4_header {
    uint8_t  version_ihl;
    uint8_t  tos;
    uint16_t total_length;
    uint16_t identification;
    uint16_t flags_frag_offset;
    uint8_t  ttl;
    uint8_t  protocol;
    uint16_t checksum;
    uint32_t src_ip;
    uint32_t dst_ip;
};

struct __attribute__((packed)) tcp_header {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq;
    uint32_t ack;
    uint16_t offset_flags;
    uint16_t window;
    uint16_t checksum;
    uint16_t urgent_ptr;
};

void print_hex(const char *label, const void *data, size_t len) {
    const unsigned char *bytes = (const unsigned char *)data;
    printf("%s (%zu bytes): ", label, len);
    for (size_t i = 0; i < len; i++) {
        printf("%02x ", bytes[i]);
    }
    printf("\n");
}

int main(void) {
    /* sizeof() proves the packed struct really is exactly the byte count
     * the protocol spec demands, with zero compiler-inserted padding. */
    printf("sizeof(struct ethernet_header) = %zu (expected 14)\n", sizeof(struct ethernet_header));
    printf("sizeof(struct ipv4_header)     = %zu (expected 20)\n", sizeof(struct ipv4_header));
    printf("sizeof(struct tcp_header)      = %zu (expected 20)\n", sizeof(struct tcp_header));
    printf("\n");

    struct ethernet_header eth;
    memcpy(eth.dst_mac, "\xaa\xbb\xcc\x00\x00\x01", 6);
    memcpy(eth.src_mac, "\xaa\xbb\xcc\x00\x00\x02", 6);
    eth.ethertype = htons(0x0800); /* IPv4 -- htons() converts host byte order to network (big-endian) byte order */

    struct ipv4_header ip;
    ip.version_ihl = 0x45;
    ip.tos = 0;
    ip.total_length = htons(40);
    ip.identification = htons(0x1c46);
    ip.flags_frag_offset = htons(0x4000);
    ip.ttl = 64;
    ip.protocol = 6; /* TCP */
    ip.checksum = 0; /* left unset -- Module 02's Python code computes this properly; this file focuses on layout */
    ip.src_ip = inet_addr("192.0.2.10");
    ip.dst_ip = inet_addr("192.0.2.20");

    struct tcp_header tcp;
    tcp.src_port = htons(51820);
    tcp.dst_port = htons(8080);
    tcp.seq = htonl(1000);
    tcp.ack = 0;
    tcp.offset_flags = htons((5 << 12) | 0x02); /* SYN */
    tcp.window = htons(64240);
    tcp.checksum = 0;
    tcp.urgent_ptr = 0;

    print_hex("Ethernet header", &eth, sizeof(eth));
    print_hex("IPv4 header    ", &ip, sizeof(ip));
    print_hex("TCP header     ", &tcp, sizeof(tcp));

    printf("\nCompare this hex to Module 02's layer_builder.py output for the same\n");
    printf("logical values -- the BYTES should match exactly (modulo IP checksum,\n");
    printf("left at 0 here). Same protocol, same layout, two completely different\n");
    printf("languages producing byte-identical wire format.\n");

    return 0;
}
