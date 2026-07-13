"""
Module 05 -- RIP (distance-vector) vs OSPF (link-state), simulated well
enough to show WHY count-to-infinity happens in one and not the other,
rather than just asserting it as a fact to memorize.

Topology (a simple 3-router chain, cost 1 per hop):

    R1 ---- R2 ---- R3

Part 1: distance-vector (RIP-like). Each router only ever tells its
neighbors "here's my distance to everywhere I know about" -- a SUMMARY,
not the actual topology. When a link breaks, routers can temporarily feed
each other stale, circular information because neither one can see the
other's reasoning, only the number it produced. That's the structural
reason count-to-infinity exists at all.

Part 2: link-state (OSPF-like). Each router instead floods "here are MY
direct links" to everyone, unmodified. Once flooded, every router has the
FULL topology graph and computes shortest paths itself (Dijkstra) instead
of trusting a neighbor's summary. A broken link is just an edge removed
from a graph every router can see directly -- there's no stale summary to
propagate because nothing is ever summarized in the first place.
"""

INFINITY = 16  # RIP's actual real-world "unreachable" constant (RFC 2453)


# ------------------------------------------------------- shared topology --
def base_links():
    return {
        "R1": {"R2": 1},
        "R2": {"R1": 1, "R3": 1},
        "R3": {"R2": 1},
    }


# ================================================== Part 1: RIP (Bellman-Ford) ==
class DVRouter:
    def __init__(self, name, neighbors):
        self.name = name
        self.neighbors = dict(neighbors)  # neighbor_name -> link cost
        self.table = {name: {"metric": 0, "next_hop": None}}
        for n, cost in neighbors.items():
            self.table[n] = {"metric": cost, "next_hop": n}

    def advertisement_for(self, neighbor, split_horizon):
        """What this router would tell `neighbor` right now."""
        out = {}
        for dest, entry in self.table.items():
            if split_horizon and entry["next_hop"] == neighbor:
                continue  # never advertise a route back to where it came from
            out[dest] = entry["metric"]
        return out

    def receive(self, from_neighbor, advertisement):
        link_cost = self.neighbors[from_neighbor]
        changed = False
        for dest, metric in advertisement.items():
            candidate = min(metric + link_cost, INFINITY)
            current = self.table.get(dest, {"metric": INFINITY, "next_hop": None})
            # Standard Bellman-Ford relaxation only accepts a STRICTLY BETTER
            # metric. But if `from_neighbor` is already the next hop I'm
            # routing this destination through, their word IS my current
            # route's truth -- I must accept their update even if it's worse
            # (that's what lets bad news, and the resulting count-to-infinity
            # ping-pong, propagate at all; without this, Part 1 below would
            # never reproduce the bug and would just silently keep routing
            # toward a link that no longer exists).
            is_current_path = current["next_hop"] == from_neighbor
            if candidate < current["metric"] or (is_current_path and candidate != current["metric"]):
                self.table[dest] = {"metric": candidate, "next_hop": from_neighbor}
                changed = True
        return changed


def run_dv_rounds(routers, split_horizon, rounds, watch_dest, watch_routers):
    for round_num in range(1, rounds + 1):
        ads = {name: {nb: r.advertisement_for(nb, split_horizon) for nb in r.neighbors} for name, r in routers.items()}
        any_changed = False
        for name, r in routers.items():
            for nb_name in r.neighbors:
                incoming = ads[nb_name].get(name)
                if incoming is not None:
                    if r.receive(nb_name, incoming):
                        any_changed = True

        watched = ", ".join(
            f"{rn}->{watch_dest}={routers[rn].table.get(watch_dest, {}).get('metric', INFINITY)}"
            for rn in watch_routers
        )
        print(f"  round {round_num}: {watched}")
        if not any_changed and round_num > 1:
            print("  (converged)")
            break


def part1_distance_vector():
    print("=" * 70)
    print("PART 1 -- RIP-style distance vector, WITHOUT split horizon")
    print("=" * 70)
    links = base_links()
    routers = {name: DVRouter(name, nbs) for name, nbs in links.items()}
    print("Initial convergence (no failures yet):")
    run_dv_rounds(routers, split_horizon=False, rounds=5, watch_dest="R3", watch_routers=["R1", "R2"])

    print("\nNow break the R2-R3 link (R2 loses its only path to R3):")
    routers["R2"].neighbors.pop("R3")
    routers["R2"].table["R3"] = {"metric": INFINITY, "next_hop": None}
    # R1 does NOT yet know -- it still has its old table entry (metric 2 via R2)
    run_dv_rounds(routers, split_horizon=False, rounds=20, watch_dest="R3", watch_routers=["R1", "R2"])
    print("  Notice the metric creeping upward instead of jumping straight to")
    print(f"  {INFINITY} (unreachable) -- that slow climb IS count-to-infinity.")

    print()
    print("=" * 70)
    print("PART 1b -- same failure, WITH split horizon")
    print("=" * 70)
    links = base_links()
    routers = {name: DVRouter(name, nbs) for name, nbs in links.items()}
    run_dv_rounds(routers, split_horizon=True, rounds=5, watch_dest="R3", watch_routers=["R1", "R2"])

    print("\nBreak the R2-R3 link again:")
    routers["R2"].neighbors.pop("R3")
    routers["R2"].table["R3"] = {"metric": INFINITY, "next_hop": None}
    run_dv_rounds(routers, split_horizon=True, rounds=5, watch_dest="R3", watch_routers=["R1", "R2"])
    print("  With split horizon, R1 never advertises 'R3 via R2' back to R2 --")
    print("  because R1 only ever learned that route FROM R2 in the first place.")
    print("  Convergence to 'unreachable' is now immediate instead of a slow climb.")


# ================================================== Part 2: OSPF (link-state) ==
def dijkstra(graph, source):
    """graph: {node: {neighbor: cost}}. Returns {node: (distance, prev_node)}."""
    import heapq
    dist = {source: 0}
    prev = {source: None}
    visited = set()
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)
        for v, cost in graph.get(u, {}).items():
            nd = d + cost
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))
    return dist, prev


def part2_link_state():
    print()
    print("=" * 70)
    print("PART 2 -- OSPF-style link-state: flood full topology, compute locally")
    print("=" * 70)
    links = base_links()
    print("Step 1: every router floods its OWN direct links to everyone.")
    print("        After flooding, every router holds the SAME full graph:")
    for name, nbs in links.items():
        print(f"          {name}'s LSA: {nbs}")

    print("\nStep 2: every router runs Dijkstra on that full graph, independently.")
    for name in links:
        dist, prev = dijkstra(links, name)
        print(f"  {name}'s shortest-path table: {dist}")

    print("\nStep 3: break the R2-R3 link and re-flood.")
    links["R2"].pop("R3")
    links["R3"].pop("R2")
    for name in links:
        dist, prev = dijkstra(links, name)
        reach = dist.get("R3", "unreachable")
        print(f"  {name}'s shortest path to R3 after the break: {reach}")
    print("  No climbing metric, no intermediate rounds -- once the LSA carrying")
    print("  news of the broken link arrives, Dijkstra recomputes the correct")
    print("  answer in one shot, because it was never working from a neighbor's")
    print("  SUMMARY in the first place -- it has the whole graph.")


if __name__ == "__main__":
    part1_distance_vector()
    part2_link_state()
