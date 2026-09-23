import "./style.css";
import { subnetInfo } from "./subnet";
import { buildFrame, type PacketFields } from "./packet";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="topbar">
    <div class="brand">packet<span>lab</span></div>
    <nav>
      <a href="https://github.com/Robert-Doe/packetlab" target="_blank" rel="noopener">GitHub</a>
      <a href="https://robertdoe.com">&larr; robertdoe.com</a>
    </nav>
  </div>

  <div class="hero">
    <h1>Packet Builder &amp; Subnet Calculator</h1>
    <p class="tagline">
      Two tools ported straight from the Packetlab course's own
      <code>subnet_calc</code> and <code>layer_builder</code> modules:
      the actual bitwise arithmetic and byte layout, running client-side.
    </p>
  </div>

  <div class="tools">
    <section class="card" id="subnet-card">
      <h2>IPv4 Subnet Calculator</h2>
      <p class="sub">Enter an address in CIDR form, e.g. <code>192.168.1.10/26</code>.</p>
      <div class="panes">
        <div>
          <div class="field-row">
            <div class="field-group">
              <label for="cidr-input">IP / CIDR</label>
              <input id="cidr-input" type="text" value="192.168.1.10/26" spellcheck="false" />
            </div>
          </div>
          <button id="subnet-btn">Calculate</button>
        </div>
        <div class="output" id="subnet-output"></div>
      </div>
    </section>

    <section class="card" id="packet-card">
      <h2>Packet Field Builder</h2>
      <p class="sub">Pick the fields for an Ethernet + IPv4 + TCP header and see the real encoded bytes.</p>
      <div class="panes">
        <div>
          <div class="field-row">
            <div class="field-group">
              <label for="src-mac">Src MAC</label>
              <input id="src-mac" type="text" value="de:ad:be:ef:00:02" spellcheck="false" />
            </div>
            <div class="field-group">
              <label for="dst-mac">Dst MAC</label>
              <input id="dst-mac" type="text" value="de:ad:be:ef:00:01" spellcheck="false" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="src-ip">Src IP</label>
              <input id="src-ip" type="text" value="192.0.2.10" spellcheck="false" />
            </div>
            <div class="field-group">
              <label for="dst-ip">Dst IP</label>
              <input id="dst-ip" type="text" value="192.0.2.20" spellcheck="false" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="src-port">Src Port</label>
              <input id="src-port" type="number" value="51820" />
            </div>
            <div class="field-group">
              <label for="dst-port">Dst Port</label>
              <input id="dst-port" type="number" value="8080" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="seq">Sequence #</label>
              <input id="seq" type="number" value="1000" />
            </div>
            <div class="field-group">
              <label for="ack">Ack #</label>
              <input id="ack" type="number" value="0" />
            </div>
          </div>
          <label>TCP Flags</label>
          <div class="checks" id="flag-checks">
            <label class="check"><input type="checkbox" data-flag="syn" checked /> SYN</label>
            <label class="check"><input type="checkbox" data-flag="ack" /> ACK</label>
            <label class="check"><input type="checkbox" data-flag="fin" /> FIN</label>
            <label class="check"><input type="checkbox" data-flag="rst" /> RST</label>
            <label class="check"><input type="checkbox" data-flag="psh" /> PSH</label>
            <label class="check"><input type="checkbox" data-flag="urg" /> URG</label>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label for="payload">Payload text (optional)</label>
              <input id="payload" type="text" value="GET /demo HTTP/1.1" spellcheck="false" />
            </div>
          </div>
          <button id="build-btn">Build Frame</button>
        </div>
        <div>
          <div class="hexdump output" id="hexdump"></div>
          <div class="field-legend" id="legend"></div>
          <div class="summary-line" id="summary"></div>
        </div>
      </div>
    </section>
  </div>

  <footer>
    <span>Packetlab &mdash; networking fundamentals, taught byte by byte.</span>
    <a href="https://github.com/Robert-Doe/packetlab" target="_blank" rel="noopener">Source on GitHub</a>
  </footer>
`;

// ---------------------------------------------------------------- subnet --
const cidrInput = document.querySelector<HTMLInputElement>("#cidr-input")!;
const subnetOutput = document.querySelector<HTMLDivElement>("#subnet-output")!;
const subnetBtn = document.querySelector<HTMLButtonElement>("#subnet-btn")!;

function row(k: string, v: string, cls = ""): string {
  return `<div class="row ${cls}"><span class="k">${k}</span><span class="v">${v}</span></div>`;
}

function renderSubnet() {
  const value = cidrInput.value.trim();
  try {
    const info = subnetInfo(value);
    subnetOutput.innerHTML = [
      row("Netmask", `${info.netmask} (/${info.prefix})`),
      row("Wildcard mask", info.wildcardMask),
      row("Network address", info.network, "hl"),
      row("Broadcast address", info.broadcast, "hl"),
      row("Usable host range", `${info.firstHost} - ${info.lastHost}`),
      row("Total addresses", String(info.totalAddresses)),
      row("Usable hosts", String(info.usableHosts)),
    ].join("");
  } catch (e) {
    subnetOutput.innerHTML = row("Error", (e as Error).message, "error");
  }
}

subnetBtn.addEventListener("click", renderSubnet);
cidrInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") renderSubnet();
});
renderSubnet();

// ----------------------------------------------------------------- packet --
const hexdumpEl = document.querySelector<HTMLDivElement>("#hexdump")!;
const legendEl = document.querySelector<HTMLDivElement>("#legend")!;
const summaryEl = document.querySelector<HTMLDivElement>("#summary")!;
const buildBtn = document.querySelector<HTMLButtonElement>("#build-btn")!;

const FIELD_COLORS = [
  "#d4a017", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#f472b6",
  "#38bdf8", "#facc15", "#fb923c", "#a3e635", "#2dd4bf", "#e879f9",
  "#93c5fd", "#fda4af", "#86efac", "#fcd34d", "#67e8f9", "#f9a8d4",
  "#bef264", "#fdba74",
];

function readFlags(): PacketFields["flags"] {
  const boxes = document.querySelectorAll<HTMLInputElement>("#flag-checks input[type=checkbox]");
  const flags: PacketFields["flags"] = { syn: false, ack: false, fin: false, rst: false, psh: false, urg: false };
  boxes.forEach((b) => {
    const key = b.dataset.flag as keyof PacketFields["flags"];
    flags[key] = b.checked;
  });
  return flags;
}

function val(id: string): string {
  return document.querySelector<HTMLInputElement>(`#${id}`)!.value.trim();
}

function num(id: string): number {
  return Number(document.querySelector<HTMLInputElement>(`#${id}`)!.value) || 0;
}

function renderPacket() {
  try {
    const fields: PacketFields = {
      dstMac: val("dst-mac"),
      srcMac: val("src-mac"),
      srcIp: val("src-ip"),
      dstIp: val("dst-ip"),
      srcPort: num("src-port"),
      dstPort: num("dst-port"),
      seq: num("seq"),
      ackNum: num("ack"),
      flags: readFlags(),
      payloadText: val("payload"),
    };

    const frame = buildFrame(fields);

    const colorForByte = new Array(frame.bytes.length).fill(-1);
    frame.fields.forEach((f, i) => {
      for (let b = f.start; b < f.end; b++) colorForByte[b] = i % FIELD_COLORS.length;
    });

    let html = `<div>Total frame size: ${frame.bytes.length} bytes</div><br/>`;
    for (let i = 0; i < frame.bytes.length; i += 16) {
      const chunk = Array.from(frame.bytes.slice(i, i + 16));
      const bytesHtml = chunk
        .map((b, j) => {
          const idx = i + j;
          const colorIdx = colorForByte[idx];
          const color = colorIdx >= 0 ? FIELD_COLORS[colorIdx] : "transparent";
          const bg = colorIdx >= 0 ? `${color}33` : "transparent";
          const hex = b.toString(16).padStart(2, "0");
          return `<span class="hex-byte" style="background:${bg};color:${colorIdx >= 0 ? color : "var(--text-dim)"}" title="offset ${idx}">${hex}</span>`;
        })
        .join("");
      html += `<div>${i.toString(16).padStart(4, "0")}:  ${bytesHtml}</div>`;
    }
    hexdumpEl.innerHTML = html;

    legendEl.innerHTML = frame.fields
      .map((f, i) => {
        const color = FIELD_COLORS[i % FIELD_COLORS.length];
        return `<div class="item"><span class="swatch" style="background:${color}"></span><span class="label">${f.label}</span><span class="detail">${f.detail}</span></div>`;
      })
      .join("");

    summaryEl.innerHTML = `
      <div><strong>Ethernet:</strong> ${frame.summary.ethernet}</div>
      <div><strong>IPv4:</strong> ${frame.summary.ip}</div>
      <div><strong>TCP:</strong> ${frame.summary.tcp}</div>
    `;
  } catch (e) {
    hexdumpEl.innerHTML = `<span style="color:var(--danger)">${(e as Error).message}</span>`;
    legendEl.innerHTML = "";
    summaryEl.innerHTML = "";
  }
}

buildBtn.addEventListener("click", renderPacket);
document.querySelectorAll("#packet-card input").forEach((el) => {
  el.addEventListener("change", renderPacket);
});
renderPacket();
