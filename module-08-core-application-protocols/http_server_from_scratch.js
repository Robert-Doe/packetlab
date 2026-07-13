/**
 * Module 08 — JS/Node port of http_server_from_scratch.py. Built on
 * Node's raw `net` module (TCP), NOT Node's own `http` module -- the
 * whole point is seeing what even Node's comparatively low-level `http`
 * module still hides from you.
 * Binds to 127.0.0.1:8091 (different port from the Python variant).
 */
const net = require("net");

const HOST = "127.0.0.1";
const PORT = 8091;

function parseRequest(raw) {
  const headerPart = raw.toString().split("\r\n\r\n")[0];
  const lines = headerPart.split("\r\n");
  const [method, path, version] = lines[0].split(" ");

  const headers = {};
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const idx = line.indexOf(":");
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[name] = value;
  }

  return { method, path, version, headers };
}

function buildResponse(statusCode, statusText, body, contentType = "text/plain") {
  const bodyBuf = Buffer.from(body);
  const headers =
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Content-Length: ${bodyBuf.length}\r\n` +
    `Connection: close\r\n` +
    `\r\n`;
  return Buffer.concat([Buffer.from(headers), bodyBuf]);
}

const ROUTES = {
  "/": () => buildResponse(200, "OK", "Hello from a hand-rolled HTTP server.\n"),
  "/about": () => buildResponse(200, "OK", "This response was assembled byte by byte, no framework involved.\n"),
};

const server = net.createServer((socket) => {
  socket.once("data", (raw) => {
    let method, path, version, headers;
    try {
      ({ method, path, version, headers } = parseRequest(raw));
    } catch (e) {
      socket.end(buildResponse(400, "Bad Request", "Malformed request line\n"));
      return;
    }

    console.log(`  ${socket.remoteAddress}:${socket.remotePort}: ${method} ${path} ${version}`);
    console.log("    headers:", headers);

    let response;
    if (method !== "GET") {
      response = buildResponse(405, "Method Not Allowed", "Only GET is implemented\n");
    } else if (ROUTES[path]) {
      response = ROUTES[path]();
    } else {
      response = buildResponse(404, "Not Found", `No route for ${path}\n`);
    }

    socket.end(response);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Hand-rolled HTTP server on http://${HOST}:${PORT}  (routes: ${Object.keys(ROUTES)})`);
});
