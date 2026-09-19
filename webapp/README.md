# Packetlab web demo

A small interactive demo of two real tools ported from this course's own
modules, running entirely client-side (no backend):

- **IPv4 Subnet Calculator** — a direct TypeScript port of
  `module-04-ip-addressing-subnetting/subnet_calc.js`: the same 32-bit
  integer bitwise math for netmask, network/broadcast address, and usable
  host range.
- **Packet Field Builder** — a browser port of
  `module-02-osi-tcpip-model/layer_builder.js`: builds real Ethernet + IPv4
  + TCP header bytes (including the RFC 1071 IPv4 header checksum) and
  renders them as an annotated hex dump.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploying

This is a static site — no server or environment variables needed. On
Vercel, Netlify, or Cloudflare Pages:

- **Root directory:** `webapp`
- **Build command:** `npm run build`
- **Output directory:** `dist`
