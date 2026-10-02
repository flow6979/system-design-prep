---
title: Red Flags (Marks Kaise Katte Hain)
order: 22
time: 6
usedIn: [t1-01-url-shortener, t1-03-news-feed, t1-05-bookmyshow, t1-11-payment-system, t2-15-flash-sale]
---

# Red Flags (Marks Kaise Katte Hain)

**Ek line me:** HLD interview me log zyada tar knowledge ki kami se nahi, balki **approach ki galtiyon** se fail hote hain. Ye list padho aur inme se ek bhi mat karo.

> **Example:** Do candidates ne same BookMyShow design banaya. Ek ne 3 min requirements poochhi, double booking ki deep dive ki, aur trade-offs bole: **Strong Hire**. Doosre ne seedha "Kafka, Redis, Cassandra, Kubernetes" bola, 25 min boxes banaye: **No Hire**. Design same tha, approach alag thi.

## Red flags: kyun hurt karta hai, kya karo

### 1. Requirements ke bina design pe jump
- **Kyun hurt:** galat problem solve karoge. Interviewer sochta hai real job me bhi bina samjhe code likhoge.
- **Karo:** pehle 3–5 min clarifying sawal. Functional + non-functional likho. Scope out karo jo nahi karna. Dekho [Interview Framework](../01-topics/00-interview-framework.md).

### 2. Over-engineering
- **Kyun hurt:** 1,000 QPS ke liye 12 microservices, multi-region active-active, Kubernetes service mesh. Dikhta hai ki tum scale aur cost ka sense nahi rakhte.
- **Karo:** simple design se shuru karo jo requirements meet kare. Phir bolo "agar 10x scale ho to yahan ye badlega".

### 3. Tech naam lena bina justification
- **Kyun hurt:** "Yahan Cassandra" bolna buzzword hai. Interviewer turant poochhega "kyun?", aur jawab nahi diya to marks gaye.
- **Karo:** har choice ke saath ek "kyunki" aur ek "kya nahi chuna": "Cassandra, kyunki write-heavy hai aur multi-row transactions nahi chahiye. Postgres nahi, kyunki 1M writes/sec ek node pe nahi hoga."

### 4. Interviewer ki di hui NFR ignore karna
- **Kyun hurt:** interviewer ne bola "double booking bilkul nahi" ya "latency < 100ms", aur tumne design me uska koi zikr nahi kiya. Ye seedha signal hai ki tum sun nahi rahe.
- **Karo:** NFRs board pe likho. Har deep dive ko unse jodo: "Ye isliye kyunki aapne strong consistency maangi thi."

### 5. Deep dives na karna
- **Kyun hurt:** sirf boxes aur arrows = junior level. Senior signal deep dive me aata hai (contention, hot keys, failure).
- **Karo:** HLD ke baad khud bolo "Main 2–3 cheezon pe deep dive karna chahunga: X, Y, Z". Question ka asli hard part pehchano.

### 6. Single points of failure chhod dena
- **Kyun hurt:** ek DB, ek Redis, ek LB, koi replica nahi. Production me ye down time hai.
- **Karo:** design ke end me har component pe "ye fail hua to?" bolo. Replicas, failover, multi-AZ. Dekho [Reliability](../01-topics/20-reliability-observability.md).

### 7. Drawing karte waqt chup rehna
- **Kyun hurt:** interviewer tumhari thinking evaluate karta hai, drawing nahi. 5 min silence = woh guess kar raha hai, aur usually galat guess.
- **Karo:** bolte jao: "Ab main Booking Service add kar raha hoon, kyunki hold aur confirm ka logic yahan rahega."

### 8. Time manage na karna
- **Kyun hurt:** 20 min requirements aur estimation me, aur deep dive ke liye time hi nahi. Ya HLD adhoora reh gaya.
- **Karo:** 45 min ka rough plan: requirements 5, estimation 3, APIs + entities 5, HLD 10, deep dives 15, wrap-up 5. Ghadi dekhte raho.

### 9. Interviewer se behes karna
- **Kyun hurt:** interviewer ka hint ya pushback usually tumhe sahi direction me le jaane ke liye hota hai. Defensive hona = collaboration ka bura signal.
- **Karo:** "Achha point hai" bolo, trade-off socho. Agree ho to design badlo. Disagree ho to politely reasoning do aur unki baat bhi accept karo: "Dono chalenge, main X lunga kyunki..., par agar Y priority ho to aapka approach better hai."

### 10. Zarurat se zyada estimation
- **Kyun hurt:** 10 min tak bandwidth, storage, cache size ka calculation, jinka design pe koi asar nahi. Time waste.
- **Karo:** sirf woh numbers jo decision badlein (read:write ratio, peak QPS, storage). Round numbers. Har number ke baad "isliye...". Dekho [Numbers Cheatsheet](../01-topics/21-numbers-cheatsheet.md).

## Quick table

| Red flag | Ek line fix |
|---|---|
| Requirements skip | 3–5 min sawal, NFR likho |
| Over-engineering | Simple se shuru, scale pe evolve |
| Buzzwords | Har tech ke saath "kyunki" + alternative |
| NFR ignore | NFR board pe, har decision usse jodo |
| No deep dive | Khud 2–3 deep dive propose karo |
| SPOF | Har box pe "ye fail hua to?" |
| Silence | Bolte hue draw karo |
| Time waste | 45 min ka plan, ghadi dekho |
| Behes | Hint ko gift samjho |
| Over-estimation | Sirf decision badalne wale numbers |

## Green flags: strong candidates kya karte hain

- **Driver seat me rehte hain:** interviewer ke poochne se pehle agla step khud bolte hain.
- **Trade-offs bolte hain:** "X liya, Y nahi, kyunki..." har major decision pe.
- **Numbers se decide karte hain:** "12 writes/sec hai, to ek Postgres kaafi hai."
- **Hard part pehchante hain:** BookMyShow me contention, feed me celebrity fan-out, payment me idempotency.
- **Failures khud uthate hain:** "Agar Redis down ho to..."
- **Simple → complex evolve karte hain:** pehle working design, phir bottleneck dhoondh ke fix.
- **Interviewer ko sath le ke chalte hain:** "Kya aap chahenge main search pe deep dive karun ya booking pe?"
- **End me improvements bolte hain:** monitoring, multi-region, analytics, jo time ki wajah se nahi kiya.

## Kin systems me lagta hai

Har question me. Practice ke liye ye do sabse achhe hain:
- [BookMyShow](../02-questions/t1-05-bookmyshow.md): NFR (no double booking) ko har decision se jodna
- [News Feed](../02-questions/t1-03-news-feed.md): over-engineering se bachke hybrid fan-out tak evolve karna
- [Payment System](../02-questions/t1-11-payment-system.md): failures aur edge cases khud uthana

## Interview me bolo

> "Design shuru karne se pehle main 2–3 minute requirements clarify karna chahunga, taaki sahi problem solve karun."

> "Ab HLD ready hai. Mujhe lagta hai is problem ka hard part X hai, to main pehle uspe deep dive karunga. Aap kisi aur area pe jaana chahein to bataiye."

## Common galtiyan

- Ye maanna ki "sahi answer" ek hi hai. Interviewer reasoning dekhta hai, final architecture nahi.
- Mock interview kiye bina sirf padhte rehna. Bol ke practice karo, timer ke saath.
- Interviewer ke hint ko ignore karke apne plan pe chalte rehna.
- Last 5 min me naya component add karna, bina wrap-up ke.

## Checklist

- [ ] 10 red flags me se kam se kam 8 bina dekhe bata sakta hoon, fix ke saath
- [ ] 45 min interview ka time plan bata sakta hoon
- [ ] Har tech choice ko "kyunki + kya nahi chuna" format me bol sakta hoon
- [ ] Interviewer ke pushback ka polite, trade-off wala jawab de sakta hoon
- [ ] 5 green flags yaad hain aur mock interview me use kar sakta hoon
