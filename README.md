# Viewinter

**Live:** https://flow6979.github.io/viewinter/

Interview prep ek jagah: system design (HLD), LLD / design patterns aur agentic AI. Hinglish aur English dono me, progress tracking, notes, Gemini se sawal aur mock interviews ke saath.

- **`content/01-topics/`**: 23 chhote topic files (caching, sharding, locks, Kafka, geospatial…). Har file 5–8 min ki hai aur batati hai ki ye kin systems me lagta hai.
- **`content/02-questions/`**: 26 sabse zyada pooche jaane wale questions. Har ek me ye sab hai: interviewer se kya confirm karna hai, requirements, estimation, HLD + flow diagrams, deep dives, decision table (kyun chuna, kya nahi chuna aur kyun), failures, "isko aur better kaise karein", follow-up sawal, aur 2-minute recap.
- **`content/03-lld/`**: LLD round ke liye OOP, SOLID aur Creational / Structural / Behavioral design patterns. Har pattern ka Java aur C++ code hai, aur sabse important patterns pe ⭐ laga hai.
- **Agentic AI** (`web/src/agents/`): pehle alag site (Agent Lab) thi, ab isi site ka section hai. [agentic-ai-handbook](https://github.com/flow6979/agentic-ai-handbook) ka asli Python code browser me Pyodide se chalta hai: ReAct, RAG, web research, multi-agent, MCP/A2A aur production labs. Build ke waqt handbook repo bundle hota hai (`npm run sync`).
- **`web/`**: website jo saara content ek jagah render karti hai. Isme checklist progress %, login ke saath notes, Ask Gemini, Mock interview mode, Revision mode, Pattern quiz, aur LLD tab (Java/C++ toggle + "Sirf ⭐ dikhao") hain.

Markdown files GitHub pe bhi seedha padh sakte ho. Diagrams GitHub khud render kar deta hai.

## 7 din ka plan

| Din | Kya padhna hai |
|---|---|
| Day 1 | Topics 00–06 + numbers cheatsheet (21) |
| Day 2 | Topics 07–20 |
| Day 3 | URL Shortener, Rate Limiter, News Feed, WhatsApp |
| Day 4 | BookMyShow, Uber, YouTube, Dropbox |
| Day 5 | Notifications, Typeahead, Payments, Web Crawler |
| Day 6 | Website ke Mock interview mode me 2–3 full rounds |
| Day 7 | Tier 2 questions (Revision mode me) + red flags (22) |
| LLD round | `03-lld` ke 5 pages. Revision ke time sirf ⭐ wale padho |

## Website local chalana

```bash
cd web
npm install
npm run dev
```

Agentic AI labs ke liye handbook bhi chahiye (dono repos ek hi folder me):

```bash
git clone git@github.com:flow6979/agentic-ai-handbook.git ../agentic-ai-handbook
cd web && HANDBOOK_DIR=../../agentic-ai-handbook node scripts/sync-handbook.mjs
```

Firebase config ke bina bhi site chalti hai. Tab progress aur notes sirf usi browser me save hote hain.

## Login setup (Firebase, ~5 min, free)

1. [console.firebase.google.com](https://console.firebase.google.com) pe naya project banao (Analytics ki zarurat nahi hai).
2. **Build → Authentication → Get started**, phir **Email/Password** aur **Google** dono enable karo.
3. **Build → Firestore Database → Create database** (production mode, koi bhi region).
4. Firestore → **Rules** tab me `web/firestore.rules` ka content paste karke **Publish** karo. Isse har user sirf apna data padh/likh paata hai.
5. **Project settings → General → Your apps → Web app (`</>`)** banao aur config copy karo.
6. Local ke liye `web/.env.example` ko `web/.env` me copy karke values bharo.
7. GitHub pe deploy ke liye repo **Settings → Secrets and variables → Actions** me ye 4 secrets daalo: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
8. Authentication → **Settings → Authorized domains** me `<username>.github.io` add karo.

Firebase ka web config public hota hai, ye normal hai. Data ki safety Firestore rules se aati hai.

## GitHub Pages deploy

1. Repo **Settings → Pages → Source: GitHub Actions** select karo.
2. `main` pe push karte hi `.github/workflows/deploy.yml` site build karke deploy kar dega. Build se pehle saare mermaid diagrams ki syntax bhi check hoti hai.

## Gemini

Website ke top bar me **Gemini key** pe click karke apni key daalo. Free key [Google AI Studio](https://aistudio.google.com/apikey) se milti hai. Key sirf aapke browser me save hoti hai, repo ya Firestore me kabhi nahi jaati.

- **Ask Gemini**: current page ke context ke saath sawal poochho.
- **Mock interview** (sirf question pages pe): Gemini interviewer banke 45 min ka round leta hai. `END` likhne pe scorecard deta hai.

## Content add/edit karna

Naya topic ya question likhne se pehle `content/STYLE.md` padho. Usme frontmatter, sections aur mermaid rules hain. Diagrams check karne ke liye: `cd web && npm run check:mermaid`.
