/**
 * Module 05 — JS/Node port of routing_protocols_sim.py. Same 3-router
 * chain, same Bellman-Ford distance-vector logic (including the
 * "unconditionally accept updates from my current next-hop" rule that
 * makes count-to-infinity reproducible at all), same Dijkstra-based
 * link-state comparison.
 */

const INFINITY = 16; // RIP's real RFC 2453 constant

function baseLinks() {
  return {
    R1: { R2: 1 },
    R2: { R1: 1, R3: 1 },
    R3: { R2: 1 },
  };
}

// ================================================== Part 1: RIP (Bellman-Ford) ==
class DVRouter {
  constructor(name, neighbors) {
    this.name = name;
    this.neighbors = { ...neighbors };
    this.table = { [name]: { metric: 0, nextHop: null } };
    for (const [n, cost] of Object.entries(neighbors)) {
      this.table[n] = { metric: cost, nextHop: n };
    }
  }

  advertisementFor(neighbor, splitHorizon) {
    const out = {};
    for (const [dest, entry] of Object.entries(this.table)) {
      if (splitHorizon && entry.nextHop === neighbor) continue;
      out[dest] = entry.metric;
    }
    return out;
  }

  receive(fromNeighbor, advertisement) {
    const linkCost = this.neighbors[fromNeighbor];
    let changed = false;
    for (const [dest, metric] of Object.entries(advertisement)) {
      const candidate = Math.min(metric + linkCost, INFINITY);
      const current = this.table[dest] || { metric: INFINITY, nextHop: null };
      const isCurrentPath = current.nextHop === fromNeighbor;
      if (candidate < current.metric || (isCurrentPath && candidate !== current.metric)) {
        this.table[dest] = { metric: candidate, nextHop: fromNeighbor };
        changed = true;
      }
    }
    return changed;
  }
}

function runDvRounds(routers, splitHorizon, rounds, watchDest, watchRouters) {
  for (let roundNum = 1; roundNum <= rounds; roundNum++) {
    const ads = {};
    for (const [name, r] of Object.entries(routers)) {
      ads[name] = {};
      for (const nb of Object.keys(r.neighbors)) {
        ads[name][nb] = r.advertisementFor(nb, splitHorizon);
      }
    }
    let anyChanged = false;
    for (const [name, r] of Object.entries(routers)) {
      for (const nbName of Object.keys(r.neighbors)) {
        const incoming = ads[nbName] ? ads[nbName][name] : undefined;
        if (incoming !== undefined) {
          if (r.receive(nbName, incoming)) anyChanged = true;
        }
      }
    }
    const watched = watchRouters
      .map((rn) => `${rn}->${watchDest}=${(routers[rn].table[watchDest] || {}).metric ?? INFINITY}`)
      .join(", ");
    console.log(`  round ${roundNum}: ${watched}`);
    if (!anyChanged && roundNum > 1) {
      console.log("  (converged)");
      break;
    }
  }
}

function part1DistanceVector() {
  console.log("=".repeat(70));
  console.log("PART 1 -- RIP-style distance vector, WITHOUT split horizon");
  console.log("=".repeat(70));
  let links = baseLinks();
  let routers = Object.fromEntries(Object.entries(links).map(([name, nbs]) => [name, new DVRouter(name, nbs)]));
  console.log("Initial convergence (no failures yet):");
  runDvRounds(routers, false, 5, "R3", ["R1", "R2"]);

  console.log("\nNow break the R2-R3 link (R2 loses its only path to R3):");
  delete routers.R2.neighbors.R3;
  routers.R2.table.R3 = { metric: INFINITY, nextHop: null };
  runDvRounds(routers, false, 20, "R3", ["R1", "R2"]);
  console.log("  Notice the metric creeping upward instead of jumping straight to");
  console.log(`  ${INFINITY} (unreachable) -- that slow climb IS count-to-infinity.`);

  console.log();
  console.log("=".repeat(70));
  console.log("PART 1b -- same failure, WITH split horizon");
  console.log("=".repeat(70));
  links = baseLinks();
  routers = Object.fromEntries(Object.entries(links).map(([name, nbs]) => [name, new DVRouter(name, nbs)]));
  runDvRounds(routers, true, 5, "R3", ["R1", "R2"]);

  console.log("\nBreak the R2-R3 link again:");
  delete routers.R2.neighbors.R3;
  routers.R2.table.R3 = { metric: INFINITY, nextHop: null };
  runDvRounds(routers, true, 5, "R3", ["R1", "R2"]);
  console.log("  With split horizon, R1 never advertises 'R3 via R2' back to R2 --");
  console.log("  because R1 only ever learned that route FROM R2 in the first place.");
  console.log("  Convergence to 'unreachable' is now immediate instead of a slow climb.");
}

// ================================================== Part 2: OSPF (link-state) ==
function dijkstra(graph, source) {
  const dist = { [source]: 0 };
  const prev = { [source]: null };
  const visited = new Set();
  // A plain array + linear scan stands in for a priority queue here --
  // fine at this topology's size, and keeps this file dependency-free.
  const queue = [[0, source]];

  while (queue.length > 0) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, u] = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const [v, cost] of Object.entries(graph[u] || {})) {
      const nd = d + cost;
      if (nd < (dist[v] ?? Infinity)) {
        dist[v] = nd;
        prev[v] = u;
        queue.push([nd, v]);
      }
    }
  }
  return { dist, prev };
}

function part2LinkState() {
  console.log();
  console.log("=".repeat(70));
  console.log("PART 2 -- OSPF-style link-state: flood full topology, compute locally");
  console.log("=".repeat(70));
  const links = baseLinks();
  console.log("Step 1: every router floods its OWN direct links to everyone.");
  console.log("        After flooding, every router holds the SAME full graph:");
  for (const [name, nbs] of Object.entries(links)) {
    console.log(`          ${name}'s LSA:`, nbs);
  }

  console.log("\nStep 2: every router runs Dijkstra on that full graph, independently.");
  for (const name of Object.keys(links)) {
    const { dist } = dijkstra(links, name);
    console.log(`  ${name}'s shortest-path table:`, dist);
  }

  console.log("\nStep 3: break the R2-R3 link and re-flood.");
  delete links.R2.R3;
  delete links.R3.R2;
  for (const name of Object.keys(links)) {
    const { dist } = dijkstra(links, name);
    const reach = dist.R3 !== undefined ? dist.R3 : "unreachable";
    console.log(`  ${name}'s shortest path to R3 after the break: ${reach}`);
  }
  console.log("  No climbing metric, no intermediate rounds -- once the LSA carrying");
  console.log("  news of the broken link arrives, Dijkstra recomputes the correct");
  console.log("  answer in one shot, because it was never working from a neighbor's");
  console.log("  SUMMARY in the first place -- it has the whole graph.");
}

part1DistanceVector();
part2LinkState();
