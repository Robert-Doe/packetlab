/**
 * Module 08 — JS/Node port of dhcp_dora_sim.py. Same simulated DORA
 * exchange, same pool-exhaustion and lease-release scenarios. Deliberately
 * NOT a real broadcast server -- see the Python file's docstring and
 * DECISIONS.md for why.
 */

class DhcpServer {
  constructor(poolStartLastOctet, poolEndLastOctet, subnetPrefix = "192.0.2", mask = "255.255.255.0", gateway = null, dns = null) {
    this.subnetPrefix = subnetPrefix;
    this.mask = mask;
    this.gateway = gateway || `${subnetPrefix}.1`;
    this.dns = dns || ["68.105.28.11", "68.105.29.11"];
    this.available = [];
    for (let i = poolStartLastOctet; i <= poolEndLastOctet; i++) {
      this.available.push(`${subnetPrefix}.${i}`);
    }
    this.offered = new Map();
    this.leases = new Map();
  }

  handleDiscover(mac) {
    if (this.leases.has(mac)) {
      const ip = this.leases.get(mac);
      console.log(`    [server] ${mac} already has a lease (${ip}) -- offering the same one back`);
      this.offered.set(mac, ip);
      return ip;
    }
    if (this.available.length === 0) {
      console.log(`    [server] pool EXHAUSTED -- no address to offer ${mac}`);
      return null;
    }
    const ip = this.available.shift();
    this.offered.set(mac, ip);
    console.log(`    [server] offering ${ip} to ${mac} (tentatively reserved, not yet leased)`);
    return ip;
  }

  handleRequest(mac, requestedIp) {
    const offeredIp = this.offered.get(mac);
    if (offeredIp !== requestedIp) {
      console.log(`    [server] NAK -- ${mac} requested ${requestedIp} but was only ever offered ${offeredIp}`);
      return null;
    }
    this.leases.set(mac, requestedIp);
    console.log(`    [server] ACK -- ${mac} leased ${requestedIp}`);
    return { ip: requestedIp, mask: this.mask, gateway: this.gateway, dns: this.dns };
  }

  release(mac) {
    const ip = this.leases.get(mac);
    if (ip) {
      this.leases.delete(mac);
      this.available.push(ip);
      console.log(`    [server] ${mac} released ${ip} -- returned to the pool`);
    }
  }
}

class DhcpClient {
  constructor(mac) {
    this.mac = mac;
    this.lease = null;
  }

  acquire(server) {
    console.log(`${this.mac}: broadcasting DHCPDISCOVER ("is anyone out there with an address for me?")`);
    const offeredIp = server.handleDiscover(this.mac);
    if (offeredIp === null) {
      console.log(`${this.mac}: no DHCPOFFER received -- staying unconfigured (this is what 169.254.x.x APIPA addresses mean in real life)`);
      return null;
    }

    console.log(`${this.mac}: received DHCPOFFER of ${offeredIp} -- broadcasting DHCPREQUEST to claim it`);
    const result = server.handleRequest(this.mac, offeredIp);
    if (result === null) {
      console.log(`${this.mac}: received DHCPNAK -- restarting the DORA process would happen here in real DHCP`);
      return null;
    }

    console.log(`${this.mac}: received DHCPACK -- configuring interface with`, result);
    this.lease = result;
    return result;
  }
}

function main() {
  const server = new DhcpServer(100, 102);

  console.log("=".repeat(70));
  console.log("Two clients acquiring leases normally");
  console.log("=".repeat(70));
  const clientA = new DhcpClient("aa:bb:cc:00:00:01");
  clientA.acquire(server);
  console.log();
  const clientB = new DhcpClient("aa:bb:cc:00:00:02");
  clientB.acquire(server);

  console.log();
  console.log("=".repeat(70));
  console.log("A client re-requesting its EXISTING lease (e.g. after a reboot)");
  console.log("=".repeat(70));
  clientA.acquire(server);

  console.log();
  console.log("=".repeat(70));
  console.log("Pool exhaustion -- only 1 address left, then none");
  console.log("=".repeat(70));
  const clientC = new DhcpClient("aa:bb:cc:00:00:03");
  clientC.acquire(server);
  console.log();
  const clientD = new DhcpClient("aa:bb:cc:00:00:04");
  clientD.acquire(server);

  console.log();
  console.log("=".repeat(70));
  console.log("Releasing a lease frees the address for reuse");
  console.log("=".repeat(70));
  server.release(clientB.mac);
  const clientE = new DhcpClient("aa:bb:cc:00:00:05");
  clientE.acquire(server);
}

main();
