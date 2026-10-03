**In one line:** A graph DB stores nodes + edges + properties where multi-hop traversal is the core need; otherwise SQL or KV is enough.

- **Model:** property graph = nodes, typed directed relationships, properties; RDF triples are for the semantic web.
- **Node vs property:** keep `city` a property; make it a node only if you traverse through it.
- **Why SQL is slow:** each hop is a self-join, fan-out explodes at 3-4 hops; fine for 1-2 hops.
- **Index-free adjacency:** a node holds direct pointers to neighbours; a hop is O(1), cost stays local.
- **Cypher:** `(a)-[:REL]->(b)`; bound variable paths (`*1..3`); `MERGE` nodes first, then the relationship.
- **Use cases:** fraud rings (shared device/phone), mutual friends/PYMK, recommendations.
- **Supernode:** apply a degree limit or precomputed scores on popular nodes.
- **Neptune:** AWS managed, openCypher/Gremlin/SPARQL; writes go to a single writer.
- **Cypher vs Gremlin:** Cypher is declarative; Gremlin is imperative.
- **When SQL is enough:** small graph, fixed hops, `WITH RECURSIVE` with depth/cycle check; follow lists in KV.
- **Scaling:** sharding is hard (a cross-machine hop is a network call); vertical + replicas; the graph is often a derived view fed by CDC.

**Say in the interview:** "A shared device or phone is one hop in a graph but a new join per link type in SQL, so graph for fraud, with Postgres as source of truth."

**Avoid:** Making the graph DB the primary store, or forgetting a cycle check in a recursive CTE.
