**Ek line:** Graph DB nodes + edges + properties me data rakhta hai jahan multi-hop traversal core hai; baaki cases me SQL ya KV kaafi hai.

- **Model:** property graph = nodes, typed directed relationships, properties; RDF triples semantic web ke liye.
- **Node vs property:** `city` property rakho; node tab banao jab uspe traverse karna ho.
- **SQL kyun slow:** har hop ek self-join, 3-4 hops pe fan-out explosion; 1-2 hops pe SQL theek.
- **Index-free adjacency:** node ke paas neighbours ke direct pointers; hop O(1), cost local.
- **Cypher:** `(a)-[:REL]->(b)`; variable path me bound do (`*1..3`); `MERGE` pehle nodes, phir relationship.
- **Use cases:** fraud rings (shared device/phone), mutual friends/PYMK, recommendations.
- **Supernode:** popular node pe degree limit ya precomputed scores.
- **Neptune:** AWS managed, openCypher/Gremlin/SPARQL; writes ek writer pe.
- **Cypher vs Gremlin:** Cypher declarative; Gremlin imperative.
- **Kab SQL:** chhota graph, fixed hops, `WITH RECURSIVE` + depth/cycle check; follow list KV me.
- **Scaling:** sharding mushkil (cross-machine hop = network call); vertical + replicas; graph aksar derived view, CDC se.

**Interview me bolo:** "Shared device ya phone graph me ek hop hai, SQL me har link type ka naya join; isliye fraud ke liye graph, source of truth Postgres."

**Galti mat karna:** Graph DB ko primary store banana, ya recursive CTE me cycle check bhool jaana.
