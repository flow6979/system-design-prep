import { useState } from 'react'
import { pageBySlug, route } from '../content'

interface Scenario {
  prompt: string
  patterns: string[]
  why: string
  links: string[]
}

// New problems that reuse the same patterns. Answer in 30 sec, then reveal.
const SCENARIOS: Scenario[] = [
  {
    prompt: 'IPL final ke tickets 10 baje open honge. 50 lakh log, 1 lakh seats.',
    patterns: ['Virtual waiting queue', 'Redis seat hold with TTL', 'DB unique constraint', 'Rate limiting'],
    why: 'Same seat pe contention aur sudden spike. BookMyShow wala design + waiting room.',
    links: ['t1-05-bookmyshow', '09-locks-and-contention'],
  },
  {
    prompt: 'Zomato pe "order live track karo" feature: delivery boy ki location har 5 sec me customer ko dikhe.',
    patterns: ['WebSocket / SSE', 'Geospatial store (Redis GEO)', 'Pub/Sub'],
    why: 'Write-heavy location updates aur real-time push to one subscriber.',
    links: ['08-real-time-communication', '13-geospatial', 't2-14-food-delivery'],
  },
  {
    prompt: 'Instagram Reels pe view count dikhana hai. Billions of views per day.',
    patterns: ['Async counting via Kafka', 'Sharded counters / stream aggregation', 'Approximate is OK'],
    why: 'Har view pe DB write nahi kar sakte. Batch/stream me aggregate karo.',
    links: ['15-counting-top-k', '07-message-queues-kafka'],
  },
  {
    prompt: 'PhonePe me "Send ₹500" button user ne do baar daba diya, network slow tha.',
    patterns: ['Idempotency key', 'Double-entry ledger', 'Strong consistency (SQL)'],
    why: 'Retry se duplicate payment na ho. Server same key pe same result de.',
    links: ['10-idempotency-retries', 't1-11-payment-system'],
  },
  {
    prompt: 'Public API ke free users ko 100 requests/min se zyada nahi dena.',
    patterns: ['Token bucket', 'Redis + Lua', 'API Gateway'],
    why: 'Classic rate limiter. Distributed counter jo atomic ho.',
    links: ['11-rate-limiting', 't1-02-rate-limiter'],
  },
  {
    prompt: 'Virat Kohli post karta hai, 25 crore followers ke feed me dikhana hai.',
    patterns: ['Hybrid fan-out', 'Pull for celebrities', 'Feed cache'],
    why: 'Celebrity ke liye fan-out on write bahut mehenga. Read time pe merge karo.',
    links: ['18-fan-out', 't1-03-news-feed'],
  },
  {
    prompt: 'Users 2GB ki video upload karte hain, phir 4 qualities me play honi chahiye.',
    patterns: ['Pre-signed URL + multipart upload', 'Queue + transcoding workers', 'CDN + adaptive bitrate'],
    why: 'Heavy blob aur long-running task. API server pe file mat lao.',
    links: ['12-blob-storage-cdn', 't1-07-youtube'],
  },
  {
    prompt: 'Amazon search box me "iph" type karte hi suggestions 50ms me aayein.',
    patterns: ['Trie / prefix → top-K precompute', 'Cache + CDN', 'Offline aggregation of search logs'],
    why: 'Read latency critical hai. Query time pe compute mat karo.',
    links: ['14-search-indexing', 't1-10-typeahead'],
  },
  {
    prompt: 'Order place hua: payment, inventory aur delivery teen alag services me update hona hai.',
    patterns: ['Saga with compensation', 'Transactional outbox', 'Idempotent consumers'],
    why: 'Distributed transaction bina 2PC ke.',
    links: ['16-distributed-transactions', '07-message-queues-kafka'],
  },
  {
    prompt: 'Har roz raat 2 baje 1 crore users ko unka monthly statement email karna hai.',
    patterns: ['Job scheduler', 'Queue + worker pool', 'Retries + DLQ', 'Rate limit to email provider'],
    why: 'Bulk async kaam jo fail-safe ho.',
    links: ['t2-18-job-scheduler', 't1-09-notification-system'],
  },
  {
    prompt: 'Dream11 contest me live rank dikhana hai, 50 lakh players.',
    patterns: ['Redis sorted set', 'Score updates via queue', 'Sharding by score range'],
    why: 'Top-K aur "meri rank" fast chahiye.',
    links: ['t2-16-leaderboard', '15-counting-top-k'],
  },
  {
    prompt: 'Product page pe price 1 crore log dekh rahe hain, update kabhi-kabhi hota hai.',
    patterns: ['Cache-aside', 'CDN', 'Read replicas', 'Invalidate on update'],
    why: 'Read-heavy, thoda stale chalega.',
    links: ['05-caching', '03-indexing-replication'],
  },
]

export function Quiz() {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const s = SCENARIOS[i]
  const go = (d: number) => {
    setI((i + d + SCENARIOS.length) % SCENARIOS.length)
    setShown(false)
  }

  return (
    <div className="quiz">
      <span className="eyebrow">Pattern quiz · {i + 1}/{SCENARIOS.length}</span>
      <h1>Kaunse patterns lagenge?</h1>
      <p className="muted">Problem padho, 30 second me bolo kaunse patterns lagenge, phir answer dekho. Naya problem pehchanne ki skill isi se aati hai.</p>
      <div className="quiz-card">
        <p className="quiz-prompt">{s.prompt}</p>
        {shown ? (
          <div className="quiz-answer">
            <ul>
              {s.patterns.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="muted">{s.why}</p>
            <div className="row wrap">
              {s.links.map((slug) => {
                const p = pageBySlug.get(slug)
                return p ? (
                  <a key={slug} className="chip" href={route(p)}>
                    {p.title.replace(/^Design (an? )?/, '')}
                  </a>
                ) : null
              })}
            </div>
          </div>
        ) : (
          <button className="btn primary" onClick={() => setShown(true)}>
            Answer dikhao
          </button>
        )}
      </div>
      <div className="row">
        <button className="btn" onClick={() => go(-1)}>
          ← Pichla
        </button>
        <button className="btn" onClick={() => go(1)}>
          Agla →
        </button>
      </div>
    </div>
  )
}
