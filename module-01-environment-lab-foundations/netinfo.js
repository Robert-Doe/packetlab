/**
 * Module 01 lab server (JavaScript / Node variant).
 *
 * Same job as netinfo_server.py, deliberately reusing the SAME
 * dashboard.html frontend, so you can compare how two different languages
 * get at the same OS-level network state:
 *
 *   Python variant -> psutil + subprocess, parses ipconfig/arp text
 *   Node variant    -> os.networkInterfaces() (structured, no parsing
 *                      needed for interfaces!) + child_process for the
 *                      things Node's os module doesn't expose (gateway,
 *                      DNS, ARP) -- so you still have to parse ipconfig/arp
 *                      text here too, same as Python.
 *
 * Zero npm dependencies on purpose -- only Node's own built-in modules.
 * Binds to 127.0.0.1 only. See ../SAFETY.md.
 */
const http = require("http");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const url = require("url");

const BASE = __dirname;
const PLATFORM = os.platform(); // 'win32', 'linux', 'darwin'

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { timeout: 5000 }).toString();
  } catch (err) {
    return `<command failed: ${err.message}>`;
  }
}

function getInterfaces() {
  // os.networkInterfaces() already gives structured data (family, mac,
  // internal) -- unlike the Python side, no text parsing needed here.
  const raw = os.networkInterfaces();
  return Object.entries(raw).map(([name, addrList]) => ({
    name,
    is_up: !addrList.every((a) => a.internal), // crude but workable signal
    speed_mbps: null, // Node's os module doesn't expose link speed
    mtu: null, // nor MTU
    addresses: addrList.map((a) => ({
      family: a.family, // Node already gives us the string "IPv4"/"IPv6"
      address: a.address,
      netmask: a.netmask,
    })),
  }));
}

function getDefaultGateway() {
  if (PLATFORM === "win32") {
    const out = run("ipconfig", ["/all"]);
    for (const line of out.split(/\r?\n/)) {
      if (line.includes("Default Gateway")) {
        const val = line.split(":").slice(1).join(":").trim();
        if (val) return val;
      }
    }
    return null;
  } else if (PLATFORM === "linux") {
    const out = run("ip", ["route", "show", "default"]);
    const m = out.match(/default via (\S+)/);
    return m ? m[1] : null;
  } else if (PLATFORM === "darwin") {
    const out = run("route", ["-n", "get", "default"]);
    const m = out.match(/gateway:\s*(\S+)/);
    return m ? m[1] : null;
  }
  return null;
}

function getDnsServers() {
  const servers = [];
  if (PLATFORM === "win32") {
    const out = run("ipconfig", ["/all"]);
    let capturing = false;
    for (const line of out.split(/\r?\n/)) {
      if (line.includes("DNS Servers")) {
        capturing = true;
        const val = line.split(":").slice(1).join(":").trim();
        if (val) servers.push(val);
        continue;
      }
      if (capturing) {
        const stripped = line.trim();
        if (/^[\d.:a-fA-F]+$/.test(stripped)) {
          servers.push(stripped);
        } else {
          capturing = false;
        }
      }
    }
  } else {
    try {
      const contents = fs.readFileSync("/etc/resolv.conf", "utf8");
      for (const line of contents.split("\n")) {
        if (line.startsWith("nameserver")) {
          servers.push(line.split(/\s+/)[1]);
        }
      }
    } catch (_) {
      /* no resolv.conf, e.g. some containers */
    }
  }
  return [...new Set(servers)];
}

function getArpTable() {
  const out = run("arp", ["-a"]);
  const pattern = /(\d{1,3}(?:\.\d{1,3}){3}).{1,20}?([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/;
  return out
    .split(/\r?\n/)
    .filter((line) => pattern.test(line))
    .map((line) => line.trim());
}

function buildNetinfo() {
  return {
    system: `Node/${PLATFORM}`,
    interfaces: getInterfaces(),
    default_gateway: getDefaultGateway(),
    dns_servers: getDnsServers(),
    arp_table: getArpTable(),
  };
}

const MIME = { ".html": "text/html", ".js": "application/javascript" };

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  if (parsed.pathname === "/api/netinfo") {
    const body = JSON.stringify(buildNetinfo());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(body);
    return;
  }

  let filePath = parsed.pathname === "/" ? "/dashboard.html" : parsed.pathname;
  filePath = path.join(BASE, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

const PORT = 5050;
server.listen(PORT, "127.0.0.1", () => {
  console.log("=".repeat(64));
  console.log(" Module 01 (Node) lab is up.");
  console.log(` Dashboard : http://127.0.0.1:${PORT}`);
  console.log(` Raw JSON  : http://127.0.0.1:${PORT}/api/netinfo`);
  console.log("=".repeat(64));
});
