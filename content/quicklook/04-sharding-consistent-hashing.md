**Ek line:** Jab data/writes ek DB me fit na hon to key se shards me baanto; consistent hashing se node add/remove pe kam data move hota hai.

- **Kyun:** storage 10 TB+ ya write throughput. Replicas writes scale nahi karte.
- **Last option:** pehle vertical, replicas, cache, archive. Sharding complexity badhata hai.
- **Hash:** even spread, par range query har shard pe aur `% N` badla to sab reshuffle.
- **Range:** range query fast, par hot spots (aaj ki date).
- **Directory:** full control, par lookup extra hop aur SPOF.
- **Shard key:** high cardinality, even distribution, main query ek shard pe. Chat = `chat_id`, orders = `user_id`.
- **Hot key:** key salting (`post#0..9`), cache, ya dedicated shard.
- **Resharding:** fixed logical shards (1024 → 8 machines) ya consistent hashing; double-write, backfill, verify, switch.
- **Consistent hashing:** ring, key clockwise pehle node pe; node add pe ~1/N data move.
- **Virtual nodes:** 100–200 per server; load even, failure load sab me bate.
- **Cross-shard:** secondary index table, scatter-gather ya analytics pipeline; 95% queries single-shard rakho.

**Interview me bolo:** "Messages `chat_id` pe hash shard, consistent hashing with vnodes taaki naya node add pe ~1/N data move ho. Hot keys ke liye salting aur cache."

**Galti mat karna:** Replicas+cache kaafi the tab bhi sharding bolna, ya `hash % N` bina resharding plan. Low cardinality key (`country`, `status`).
