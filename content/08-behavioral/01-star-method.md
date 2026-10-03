---
title: STAR Method
order: 1
time: 10
---

# STAR Method

**Ek line me:** behavioral sawal ("Tell me about a time when...") ka jawab ek kahani hai, aur STAR us kahani ka skeleton hai: Situation, Task, Action, Result.

> **Example:** "Tell me about a time you handled a production issue." Ek candidate 4 minute tak system ka architecture samjhata raha aur end me bola "phir humne fix kar diya". Doosre ne 90 second me bataya ki kya toota, uski zimmedari kya thi, usne kya 3 cheezein ki, aur downtime 40 min se 8 min pe aaya. Doosra hire hua.

## ⭐ STAR kya hai

| Part | Kya bolna hai | Time (2 min answer me) |
|---|---|---|
| **S**ituation | Context: team, product, scale, problem. Sirf utna jitna samajhne ke liye zaruri | ~15% (15–20 sec) |
| **T**ask | Tumhari zimmedari kya thi. Goal ya constraint (deadline, SLA) | ~10% (10 sec) |
| **A**ction | Tumne **khud** kya kiya, step by step, aur kyun | ~55–60% (60–70 sec) |
| **R**esult | Numbers me outcome + kya seekha | ~15–20% (15–20 sec) |

- **Action sabse bada hissa hai.** Interviewer yahi score karta hai. Situation lamba khinchna sabse common galti hai.
- Poora jawab **60–120 sec**. Usse lamba ho to interviewer beech me kaat dega.
- Result ke baad ek line **learning** ki: "Tab se main X karta hoon." Ye growth dikhata hai.

## ⭐ "I" not "We"

Interviewer tumhe hire kar raha hai, tumhari team ko nahi. "Humne migrate kiya" se pata nahi chalta tumne kya kiya.

| ❌ Vague | ✅ Clear |
|---|---|
| "We migrated the service to Kafka." | "Maine consumer design kiya aur dual-write ka rollout plan likha." |
| "Team ne bug dhoondha." | "Maine logs me pattern dekha ki sirf retry wale requests fail ho rahe the." |
| "We decided to use Redis." | "Maine 2 options benchmark kiye aur Redis propose kiya, lead ne approve kiya." |

- "We" Situation me chalega (team context). **Action me "I" hona chahiye.**
- Team ka credit dena bura nahi: "Rahul ne frontend sambhala, maine backend aur rollout." Isse clear hota hai ki tumhara hissa kya tha.
- Ulta bhi galat hai: sab kuch "I" bolna jab clearly team kaam tha. Follow-up me pakde jaoge.

## ⭐ Result ko quantify karo

Numbers ke bina result yaad nahi rehta. Har story me kam se kam ek number.

| Type | Example |
|---|---|
| Latency | p99 1.2 s → 300 ms |
| Reliability | Incidents/month 6 → 1, error rate 2% → 0.1% |
| Cost | AWS bill ₹4 lakh/month kam |
| Time | Release cycle 2 hafte → 3 din, on-call pages 40% kam |
| Business | Checkout conversion +1.5%, 2 lakh users ko feature mila |
| People | 3 naye joiners ko onboard kiya, unka first PR 1 hafte me |

- Exact number yaad nahi? Approx bolo aur honest raho: "lagbhag 30% kam".
- Number nahi hai to qualitative impact: "ye pattern baad me 4 aur teams ne apnaya".
- Fail hui story me bhi result hota hai: kya bacha, kya seekha, kya badla.

## ⭐ Bad vs good answer

**Sawal:** "Tell me about a time you missed a deadline."

**❌ Bad (vague, no ownership):**
> "Haan, ek baar humara release late ho gaya tha kyunki requirements baar baar change ho rahe the aur QA bhi late tha. Product team clear nahi thi. Phir humne thoda extra kaam kiya aur ek hafte baad release kar diya. Aise cheezein hoti rehti hain."

Kya galat hai: blame doosron pe, "humne", koi action detail nahi, koi number nahi, koi learning nahi.

**✅ Good (STAR):**
> **S:** "Pichhli company me main payments team me SDE-1 tha. Humein UPI autopay mandate feature 15 March tak ship karna tha, kyunki ek bade merchant ka launch usse juda tha."
> **T:** "Mandate creation aur webhook handling ka backend mera tha, estimate 3 hafte."
> **A:** "Doosre hafte me mujhe dikha ki bank ka sandbox webhooks inconsistent bhej raha hai, aur integration testing me 5–6 din extra lagenge. Maine usi din apne lead ko bataya, ye nahi socha ki weekend me cover kar lunga. Maine scope todne ka proposal diya: v1 me sirf create aur cancel, pause/resume v2 me. Merchant ke liye wahi zaruri the. Maine webhook ke liye ek mock server banaya taaki main bank pe block na rahoon, aur daily 10 min ka sync bank ke integration team ke saath set kiya."
> **R:** "Hum 4 din late hue, par merchant ka launch nahi ruka kyunki v1 unke zaruri flows cover karta tha. Pause/resume 2 hafte baad gaya. Seekh: ab main external dependency wale kaam me pehle hafte hi end-to-end sandbox test karta hoon, aur risk dikhte hi flag karta hoon."

Kyun achha hai: ownership, early communication, trade-off (scope cut), number (4 din), learning.

## ⭐ Follow-up probing kaise hota hai

Achhe interviewers (Amazon bar raiser, Google) ek story pe 10–15 min tak khodte hain. Script yaad karke nahi chalega, sach hona chahiye.

Typical follow-ups:
- "Tumne exactly kya kiya? Code likha ya sirf discuss kiya?"
- "Aur kya options the? Woh kyun nahi chuna?"
- "Agar dobara karo to kya alag karoge?"
- "Lead/teammate ka reaction kya tha? Unhone disagree kiya to?"
- "Ye number kaise measure kiya?"
- "Sabse mushkil part kya tha?"

Kaise taiyaar ho:
- Har story ke liye 2–3 **alternatives** yaad rakho jo tumne reject kiye, aur kyun.
- Har number ka **source** pata ho (Grafana dashboard, A/B test, billing report).
- "Dobara karun to" wala jawab ready rakho. Perfect story suspicious lagti hai.
- Nahi yaad to bolo "exact yaad nahi, roughly X tha". Banao mat.

## STAR ke variants

| Format | Kya extra hai | Kab use karo |
|---|---|---|
| **STAR** | Base | Default |
| **STARL** | + Learning | Failure / mistake wale sawal |
| **CAR** | Context, Action, Result (S+T merge) | Jab time kam ho, rapid round |
| **SOAR** | Situation, Obstacle, Action, Result | Jab story ka core ek blocker ho |

Naam se fark nahi padta. Rule same: chhota context, lamba action, numbers wala result.

## Story kaise likh ke taiyaar karo

1. Ek line ka **headline**: "Order service ka MySQL → Postgres migration, zero downtime".
2. S aur T: 2 lines total.
3. A: 3–5 bullets, har bullet "Maine ... kiya, kyunki ...".
4. R: 1–2 numbers + 1 learning.
5. Zor se bolo, timer lagao. 2 min se zyada → Situation kaato.
6. Ek dost ko sunao aur usse 3 follow-up poochhne bolo.

Poori list ke liye dekho [Story Bank](../08-behavioral/05-story-bank.md).

## Interview me bolo

> "Main ek specific example deta hoon. Context ye tha ki..." (generic "I usually..." ke bajaye seedha ek story)

> "Mera specific role ye tha..." (Task clear karne ke liye, taaki "we" confusion na ho)

## Common galtiyan

- **Hypothetical jawab:** "Main aisa karunga..." Sawal "Tell me about a time" hai, to past ki real story chahiye.
- **Lamba Situation:** 1 min tak architecture samjhana. Interviewer ko sirf utna context chahiye jitna action samajhne ke liye zaruri.
- **"We" hi "we":** tumhara role gayab.
- **Result bhool jaana** ya bina number ke khatam karna: "...aur phir sab theek ho gaya."
- **Blame game:** PM, QA, manager ko dosh dena. Red flag hai, chahe sach ho.
- **Ek hi story har sawal pe:** 6–8 alag stories rakho.
- **Script ratna:** robotic lagta hai aur follow-up me toot jaata hai. Bullets yaad rakho, words nahi.
- **Fake story:** probing me 2nd–3rd sawal pe pakdi jaati hai. Bar raiser isi me trained hote hain.

## Checklist

- [ ] STAR ke 4 parts aur unka time split (Action ~60%) bata sakta hoon
- [ ] Apni ek story 90 sec me STAR me bol sakta hoon, Action me "I" use karke
- [ ] Har story ke result me kam se kam ek number de sakta hoon
- [ ] Bad vs good answer ka fark (blame, we, no number, no learning) bata sakta hoon
- [ ] Apni story pe 5 follow-up sawal (alternatives, dobara kya karta, number kaise measure) ka jawab de sakta hoon
- [ ] STAR ki 5 common galtiyan bata sakta hoon
