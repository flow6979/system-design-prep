---
title: Common Behavioral Questions
order: 3
time: 20
---

# Common Behavioral Questions

**Ek line me:** SDE interviews me 80% behavioral sawal in 12 me se kisi ek ka variant hote hain. Har ek ke liye ek real story taiyaar rakho, aur samjho ki interviewer us sawal se kya signal dhoondh raha hai.

> **Example:** "Tell me about a time you disagreed with your manager" aur "Tell me about a time you pushed back on a decision" ek hi sawal hai. Amazon isse "Have Backbone" kehta hai, Google "collaboration", Flipkart "ownership". Story ek, label alag.

Har sawal ka format: **Kya check karte hain** → **Sample answer (STAR)** → **Template** → **Red flags**. Sample answers 60–120 sec ke hain. Inhe copy mat karo, apni story isi shape me daalo. STAR basics ke liye dekho [STAR Method](../08-behavioral/01-star-method.md).

## ⭐ Conflict aur disagreement

### Conflict with a teammate

**Kya check karte hain:** kya tum data aur empathy se conflict sulajhate ho, ya ego se. Kya relationship baad me bhi theek raha.

**Sample answer:**
> **S:** "Order service me hum retry logic add kar rahe the. Mera teammate Arjun chahta tha ki har failed call 5 baar retry ho, turant."
> **T:** "Main us PR ka reviewer tha aur downstream inventory service ka on-call bhi."
> **A:** "Mujhe dar tha ki outage ke time 5x retries inventory ko aur gira denge. PR pe lamba comment thread karne ke bajaye maine 15 min ki call ki aur pehle uski concern samjhi: woh chahta tha ki user ka order fail na ho. Phir maine pichhle mahine ke incident ka graph dikhaya jahan retry storm ne recovery 20 min late ki thi. Hum dono ne milke exponential backoff with jitter aur max 3 retries pe agree kiya, aur maine circuit breaker add karne me uski help ki."
> **R:** "Next inventory blip me order failures 0.3% rahe aur inventory 2 min me recover hui. Arjun ne baad me yahi pattern payment client me bhi lagaya. Seekh: disagreement ko 'mera vs tera' nahi, 'data vs assumption' banao."

**Template:** "[Teammate] chahta tha [X], main [Y] sochta tha kyunki [risk]. Maine pehle unki concern samjhi: [concern]. Phir [data/experiment] dikhaya. Humne [middle path] pe agree kiya. Result: [number], aur relationship [kaisa raha]."

**Red flags:** teammate ko bura dikhana. "Main sahi tha" pe khatam karna. Manager ke paas escalate karna pehla step ho.

### Disagreement with manager

**Kya check karte hain:** backbone (sahi baat bolne ki himmat) aur disagree-and-commit (decision ke baad poora saath). Respect ke saath push back.

**Sample answer:**
> **S:** "Mere manager chahte the ki notification service ko 1 mahine me Node se Go me rewrite karein, kyunki CPU cost badh rahi thi."
> **T:** "Main us service ka owner tha, rewrite mujhe lead karna tha."
> **A:** "Maine pehle profiling ki. 70% CPU sirf ek JSON template rendering function me ja raha tha. Maine ek 1-page doc likha: option A full rewrite (4–6 hafte, risk high), option B hot path fix (1 hafta). Manager ke saath 1:1 me data dikhaya aur bola ki main galat bhi ho sakta hoon, isliye B ko 1 hafta try karte hain, kaam na kare to A. Unhone agree kiya."
> **R:** "Template caching aur ek library change se CPU 55% gira aur ₹1.5 lakh/month bacha. Rewrite ki zarurat nahi padi. Agar woh A pe hi rehte, to main poore effort se A karta. Seekh: opinion ke saath data aur ek cheap experiment lao."

**Template:** "[Manager] chahte the [X]. Mujhe [concern] tha. Maine [data/doc] banaya, options aur trade-offs ke saath. [1:1 me] discuss kiya. Decision [jo hua]. Maine [kaise commit kiya]. Result: [number]."

**Red flags:** "Maine chup-chaap maan liya" (no backbone). "Main fir bhi apne tareeke se kiya" (no commit). Manager ki burai.

## ⭐ Failure aur mistakes

### Biggest failure

**Kya check karte hain:** self-awareness, ownership, aur kya tum fail hone se seekhte ho. Asli failure chahiye, "main bahut perfectionist hoon" nahi.

**Sample answer:**
> **S:** "Mera pehla bada project tha ek internal feature flag service, 4 teams ke liye."
> **T:** "Design se launch tak main owner tha, 2 mahine ka timeline."
> **A:** "Maine design 3 hafte tak polish kiya, multi-tenant, UI, audit logs sab, par kisi consumer team se beech me baat nahi ki. Launch pe pata chala ki 2 teams ko SDK Python me chahiye tha, maine sirf Java banaya tha. Adoption 4 me se 1 team. Maine ownership li: retro me khud bataya ki galti requirement validation ki thi. Phir 2 hafte me Python SDK banaya aur har team ke saath 30 min ka onboarding kiya."
> **R:** "3 mahine me 4 me se 4 teams aa gayi, par project 6 hafte late hua. Ab main kisi bhi platform kaam me pehle hafte 2–3 consumers ke saath design review karta hoon aur ek thin end-to-end slice pehle ship karta hoon."

**Template:** "[Project/goal] me main [owner/role] tha. Maine [galat decision] kiya kyunki [reason]. Result: [kya bura hua, number]. Maine [ownership + fix] kiya. Ab main [changed behaviour] karta hoon."

**Red flags:** failure jo actually success hai. Blame team pe. Koi learning nahi, ya learning jo baad me apply nahi hui.

### A mistake you made

**Kya check karte hain:** honesty, kitni jaldi accept aur fix kiya, aur kya system-level fix kiya taaki dobara na ho.

**Sample answer:**
> **S:** "Ek Friday shaam maine ek DB migration chalaya jo `orders` table pe naya index bana raha tha."
> **T:** "Migration aur deploy mera tha."
> **A:** "Maine `CREATE INDEX` bina `CONCURRENTLY` ke chala diya. 30 lakh rows wali table pe write lock laga aur checkout API 4 min tak timeout hui. Alert aate hi maine team channel pe bola 'ye mera migration hai', query cancel ki, aur 6 min me sab normal hua. Usi raat incident doc likha. Phir maine CI me ek migration linter add kiya jo bade tables pe non-concurrent index ya column default ko block karta hai."
> **R:** "~1,200 orders ko retry karna pada, koi data loss nahi. Agle 1 saal me us class ka koi incident nahi hua, aur linter ne 3 aur risky migrations pakde. Seekh: individual galti ka fix process me daalo."

**Template:** "Maine [galti] ki. Impact: [number]. Maine turant [accept + contain] kiya. Root cause [X]. Fir [process/automation fix] kiya taaki dobara na ho. Result: [number]."

**Red flags:** chhoti si galti (typo) choose karna. Galti chhupana ya der se batana. Sirf "main zyada careful rahunga" wala fix.

## ⭐ Delivery aur ownership

### Tight deadline

**Kya check karte hain:** prioritisation, scope negotiate karna, communication. Sirf "raat bhar kaam kiya" nahi.

**Sample answer:**
> **S:** "IPL season se 2 hafte pehle product ne bola ki live match page pe 'predict & win' contest chahiye. Normal estimate 5 hafte tha."
> **T:** "Main backend lead tha, 2 aur engineers ke saath."
> **A:** "Maine PM ke saath feature list ko must-have aur nice-to-have me toda. Leaderboard real-time ke bajaye 5 min refresh, aur rewards manual. Kaam 3 parallel tracks me baanta aur daily 15 min standup rakha. Sabse risky part, 2 lakh concurrent submits, maine khud liya: Redis me write karke Kafka se async DB me. Day 8 pe load test kiya, taaki fix ke liye time rahe."
> **R:** "Pehle match se 1 din pehle launch hua. Peak pe 3.2 lakh submits/min, zero downtime. 18 lakh users ne participate kiya. Real-time leaderboard agle 2 hafte me gaya."

**Template:** "Deadline [X] thi, normal estimate [Y]. Maine [PM/lead] ke saath scope [cut/phase] kiya. Kaam [kaise baanta]. Sabse bada risk [Z], use maine [kaise de-risk kiya]. Result: [date + number]. Baad me [deferred scope]."

**Red flags:** quality ya testing skip karna aur use achha batana. Overtime ko hi solution batana. Stakeholders ko surprise dena.

### Ownership beyond your role

**Kya check karte hain:** kya tum "ye mera kaam nahi" bolte ho, ya problem dekh ke khud uthate ho. Amazon Ownership, Flipkart/Swiggy ka favourite.

**Sample answer:**
> **S:** "Humare team ka CI pipeline 35 min leta tha. Har koi complain karta tha, par koi owner nahi tha, devops team busy thi."
> **T:** "Ye officially mera kaam nahi tha. Main feature work pe tha."
> **A:** "Maine manager se 2 din/sprint ka time maanga, ek doc ke saath ki 12 engineers × 6 builds/day × 35 min kitna time waste hai. Profiling se pata chala 60% time integration tests me tha jo serially chal rahe the, aur Docker layers cache nahi ho rahi thi. Maine tests ko 4 shards me parallel kiya aur layer caching on ki. Devops team ke saath PR review karwaya taaki woh ise maintain kar sakein."
> **R:** "Build 35 min se 9 min. Har hafte team ke ~150 engineer-hours bache. Baad me 3 aur teams ne yahi setup copy kiya."

**Template:** "[Problem] sabko affect kar raha tha, par owner nahi tha. Maine [manager se time/permission] liya, [data] ke saath. Root cause [X]. Maine [action] kiya aur [handover/doc]. Result: [number], [kisne adopt kiya]."

**Red flags:** apna main kaam chhod ke hero banna. Bina bataye doosri team ke system me changes. Credit lene ka tone.

### Handling ambiguous requirements

**Kya check karte hain:** kya tum clarity khud create karte ho (questions, assumptions likhna, prototype) ya wait karte ho.

**Sample answer:**
> **S:** "PM ne ticket diya: 'Merchants ko refunds ka better visibility do.' Bas itna."
> **T:** "Mujhe isko design karke 1 sprint me kuch ship karna tha."
> **A:** "Maine pehle support team se pichhle mahine ke 200 refund tickets ka data liya. 70% sawal 'refund kab aayega' the. Maine ek 1-page doc me 3 assumptions likhe aur PM ke saath 30 min me lock kiye: status timeline, expected date, aur bank reference number. Dashboards ka bada version v2 me. Maine ek Figma-level mock aur API contract banaya, 2 merchants ko dikhaya, feedback se 1 field add ki."
> **R:** "1 sprint me ship hua. Refund status wale support tickets 45% kam hue agle mahine. Doc template baad me team ka standard ban gaya."

**Template:** "Requirement thi [vague line]. Maine [data/users] se samjha ki asli problem [X] hai. [Assumptions] likh ke [PM] ke saath lock kiye. [Thin v1] ship kiya. Result: [number]."

**Red flags:** "PM ne clear nahi bataya isliye late hua." Bina sawal poochhe kuch bhi bana dena. Har detail ke liye wait karna.

## Feedback

### Giving / receiving tough feedback

**Kya check karte hain:** kya tum feedback defensive hue bina le sakte ho, aur kya tum kisi ko seedha par respectfully feedback de sakte ho.

**Sample answer (receiving):**
> **S:** "Mere pehle half-year review me lead ne bola ki mere PRs bahut bade hote hain (1,500+ lines) aur review me 3–4 din lagte hain."
> **T:** "Mujhe isko accept karke apna tareeka badalna tha."
> **A:** "Pehla reaction tha ki mera kaam complex hai. Par maine pichhle 10 PRs dekhe: average 1,200 lines, average review time 3.5 din. Maine lead se 2 achhe examples maange. Phir har feature ko stacked PRs me todna shuru kiya, max ~300 lines, aur pehle ek design note PR. Har mahine lead se check kiya ki farak dikh raha hai."
> **R:** "Average review time 3.5 din se 1 din. Next cycle me 'strong collaborator' rating mili. Ab main naye joiners ko yahi sikhata hoon."

**Template (giving):** "[Teammate] ka [behaviour] team ko [impact] kar raha tha. Maine private me, specific example ke saath bola: [SBI: situation, behaviour, impact]. Unki side suni. Humne [agreement] kiya. Result: [change]."

**Red flags:** "Mujhe kabhi tough feedback nahi mila." Feedback ko galat batana. Public me feedback dena.

## ⭐ Production aur technical stories

### A production incident you handled

**Kya check karte hain:** pressure me calm, structured debugging, communication, aur RCA ke baad permanent fix. Dekho [Reliability](../01-topics/20-reliability-observability.md).

**Sample answer:**
> **S:** "Diwali sale ki raat 9 baje, humare checkout ka p99 400 ms se 6 sec ho gaya aur payment success 97% se 82% gira."
> **T:** "Main on-call tha, incident commander bhi."
> **A:** "Pehle maine status channel pe update daala aur payments team ko pull kiya. Dashboard pe dikha ki DB connections max pe the. Last deploy 2 ghante pehle tha, maine rollback kiya, par fark nahi pada, isliye deploy cause nahi tha. Slow query log me ek coupon validation query thi jo naye 'festive' coupon ki wajah se full table scan kar rahi thi. Maine coupon check ko feature flag se temporarily cache-only mode pe dala, 4 min me p99 normal. Phir index add kiya aur flag hataya. Har 10 min stakeholders ko update diya."
> **R:** "Total impact 23 min, ~₹18 lakh GMV ki failed attempts, jinme 70% users ne retry karke pay kiya. Postmortem me 3 action items: query review in coupon creation, DB connection alerts at 80%, aur load test me real coupon data. Next sale pe zero incident."

**Template:** "[Time/context] pe [symptom + metric] hua. Main [role] tha. Pehle [communicate + mitigate]. Hypothesis [X] check ki, [rule out]. Root cause [Y]. Mitigation [Z] se [time] me normal. Permanent fix [A]. Result: [impact number + kya badla]."

**Red flags:** hero story bina RCA ke. Root cause ke liye mitigation rok ke rakhna. Communication ka zikr hi nahi.

### Proudest project

**Kya check karte hain:** technical depth, scope, aur tumhe kis cheez se motivation milti hai. Yahan se HLD jaise deep follow-ups aate hain.

**Sample answer:**
> **S:** "Humara order service MySQL pe tha, ek table me 40 crore rows. Har sale pe replication lag 30 sec tak jaata tha."
> **T:** "Maine propose kiya aur lead kiya: order data ko month-wise partition aur hot data ko naye Postgres cluster pe migrate karna, zero downtime."
> **A:** "Maine 4 phase plan banaya: dual-write, backfill, shadow reads compare, cutover. Dual-write me ek reconciliation job likha jo har ghante mismatch count deta tha. Shadow reads me 0.02% mismatch mila, root cause timezone conversion tha, fix kiya. Cutover feature flag se 1% → 10% → 100% kiya 1 hafte me. Rollback plan har step pe test kiya."
> **R:** "Zero downtime, zero data loss. p99 read 800 ms se 120 ms. Sale pe replication lag 1 sec se kam. Isse main SDE-2 promote hua aur ye playbook 2 aur migrations me use hua."

**Template:** "[Problem + scale]. Maine [propose/lead] kiya [solution]. Approach: [phases/key decisions + trade-off]. Sabse mushkil part [X], aise solve kiya. Result: [2 numbers]. Kyun proud hoon: [reason]."

**Red flags:** project jahan tumhara role chhota tha. Tech details nahi bata pate. Sirf "kaafi complex tha".

### Learning something quickly

**Kya check karte hain:** learn and be curious. Unknown tech/domain me kitni jaldi productive ho jaate ho, aur kaise.

**Sample answer:**
> **S:** "Team ka ek Kafka consumer lag kar raha tha, aur Kafka jaanne wala engineer chhutti pe tha. Maine kabhi Kafka production me nahi chalaya tha."
> **T:** "2 din me consumer lag theek karna tha, warna order notifications late jaate."
> **A:** "Pehle 2 ghante maine docs se sirf woh concepts padhe jo chahiye the: partitions, consumer groups, rebalancing, commit. Phir local docker me reproduce kiya. Pata chala ki consumer har message pe sync DB call kar raha tha aur `max.poll.interval` cross hone se baar baar rebalance ho raha tha. Maine batch processing (500 messages) aur partitions 6 se 24 kiye. Fix se pehle ek senior se 20 min review karwaya."
> **R:** "Lag 2 lakh messages se 0 pe 3 ghante me. Notifications ka delay 15 min se 5 sec. Maine team ke liye ek 1-page 'Kafka consumer checklist' likhi."

**Template:** "[Tech/domain] mujhe nahi aata tha, aur [deadline/reason]. Maine [focused learning plan] kiya, [hands-on/reproduce], [expert se validate]. Result: [number]. Baad me [share kiya]."

**Red flags:** "Maine Udemy course kiya" bina apply kiye. Learning ka koi structure nahi. Kisi se help na lena.

## ⭐ Motivation

### Why are you leaving / why this company

**Kya check karte hain:** motivation genuine hai, negative nahi, aur tumne company research ki hai. Ye STAR nahi, 30–45 sec ka seedha jawab hai.

**Sample answer:**
> "Pichhle 3 saal me maine apni company me bahut seekha. Catalog search ko scale kiya aur ek chhoti team lead ki. Ab mera product stable phase me hai aur zyada kaam maintenance hai. Main aisi jagah chahta hoon jahan high-scale, correctness-critical problems hon. Razorpay me ye isliye fit lagta hai: payments me idempotency aur reconciliation jaisi problems hain jo mujhe excite karti hain, maine aapka engineering blog pe ledger redesign wala post padha, aur ye team abhi naya product bana rahi hai jahan ownership zyada hogi."

**Template:** "[Current company] me maine [achievement] kiya. Ab main [growth: scope/domain/scale] chahta hoon. [Company] me [specific: product, tech, team, blog/launch] ki wajah se ye fit hai, aur main [kya contribute karunga]."

**Red flags:** current company/manager ki burai. Sirf paisa ya "brand name". Company ke baare me kuch specific na pata hona. Notice period ya counter-offer ka ulta-seedha jawab.

## Quick table

| Sawal | Signal | Story type |
|---|---|---|
| Conflict with teammate | Collaboration | Design/code review disagreement |
| Disagree with manager | Backbone + commit | Tech decision pushback with data |
| Biggest failure | Self-awareness | Project jo galat gaya |
| Mistake | Honesty, process fix | Prod bug jo tumne introduce kiya |
| Tight deadline | Prioritisation | Scope cut + delivery |
| Ownership beyond role | Ownership | Kisi orphan problem ko fix kiya |
| Ambiguous requirements | Clarity create karna | Vague ticket → shipped v1 |
| Tough feedback | Growth | Feedback jo tumne apply kiya |
| Production incident | Calm under pressure | On-call incident |
| Proudest project | Depth | Migration / scale project |
| Learning quickly | Curiosity | New tech under deadline |
| Why leaving / why us | Motivation | Seedha 30–45 sec |

## Checklist

- [ ] 12 common sawal aur har ek ka signal (interviewer kya check karta hai) bata sakta hoon
- [ ] Conflict aur manager disagreement ki apni story bol sakta hoon jisme data aur disagree-and-commit ho
- [ ] Failure aur mistake ki real story de sakta hoon jisme ownership aur process fix ho
- [ ] Production incident ki story bol sakta hoon: mitigate → root cause → permanent fix → numbers
- [ ] Har sawal ke template me apni story bhar ke 60–120 sec me bol sakta hoon
- [ ] "Why leaving / why this company" ka positive, company-specific jawab 45 sec me de sakta hoon
- [ ] Har sawal ke 2 red flags bata sakta hoon
