**Ek line:** Relational DB = tables + keys + SQL, system design ka default choice; Postgres se shuru karo aur SQL patterns ready rakho.

- **Keys:** PK unique + NOT NULL; FK referential integrity; M:N ke liye junction table.
- **PK choice:** single DB me `BIGINT`; distributed me UUIDv7/Snowflake, random UUIDv4 nahi.
- **Normalization:** default normalize, specific read path ke liye denormalize, aur copy ka update path batao.
- **Joins:** LEFT JOIN ke right-table filter `ON` me daalo, `WHERE` me nahi (INNER ban jaata hai).
- **NOT IN vs NOT EXISTS:** subquery me NULL ho to `NOT IN` empty deta hai; `NOT EXISTS` use karo.
- **WHERE vs HAVING:** WHERE group se pehle (index use), HAVING group ke baad.
- **Paisa:** `NUMERIC` ya integer paise; FLOAT kabhi nahi.
- **Postgres vs MySQL:** Postgres features/correctness; InnoDB me PK hi physical order hai.
- **Postgres bloat:** har UPDATE naya tuple banata hai; vacuum tune karo.
- **WAL:** commit pe sirf WAL fsync hota hai, data file nahi; crash pe redo (ACID ka D).
- **Top N per group / 2nd highest:** window function (`DENSE_RANK`) + outer filter; `OFFSET 1` ties me galat.

**Interview me bolo:** "Main Postgres se shuru karunga; jab write throughput limit aayegi tab `user_id` se shard karunga."

**Galti mat karna:** Pehle din se sharding design karna, ya `SELECT *` aur FLOAT paise ke liye use karna.
