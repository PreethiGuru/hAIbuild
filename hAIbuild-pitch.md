# hAIbuild

*Patchamomma 2026 — Build Phase Touchpoint*
Built by Preethi & Anuhya

**A gamified daily-habit app that keeps everyone fluent in AI/ML using real industry trend data in an engaging way that lets you skip the daily doomscrolling.**

Core app: live & functional · Gemini API · Firestore · BigQuery · ADK · Cloud Run

---

## The Problem

AI/ML moves too fast to track passively. New models, tools, and techniques — RAG, agents, vector databases, fine-tuning — reshape best practice every few months.

Yet most people whose work touches technology have no structured way to keep up. They either binge-read newsletters in sporadic bursts, or they fall behind entirely and find out about a shift only when it's already the new normal.

## The Idea

hAIbuild turns "staying current in AI/ML" into a daily rep — you're literally building your AI fluency, one habit rep at a time. Every day, the app serves four bite-sized pieces:

1. **Pulse** — what's actually trending right now, derived from real developer signal, not editorial guesswork.
2. **Concept** — a deep-dive that builds durable intuition on one core ML idea.
3. **Practice** — an applied problem that keeps hands-on skills sharp.
4. **Battle** — a timed quiz that locks the day's learning into memory.

Streaks, XP, an ELO rating, and a penguin mascot make the habit sticky — the same reward loop that makes a language-learning streak hard to break, pointed at AI/ML fluency instead.

## Under the Hood

Built on Google's Agent Development Kit, three Gemini-powered agents turn raw signal into a single day's content:

**Trend pipeline:**
`Public data (Stack Overflow tag trends + Hacker News AI/ML volume)` → `BigQuery (trend ranking)` → `Trend Agent` → `Curriculum Agent (+ Firestore weak spots)` → `Today's Pulse · Concept · Practice · Battle`

**Coach loop:**
`Firestore (streaks, XP, battle history)` → `Coach Agent` → `Weekly readiness report`

| Service | Role in hAIbuild |
|---|---|
| **Gemini API** | Generates Pulse briefings, concept deep-dives, quiz questions, hints, and feedback. Already integrated. |
| **Firestore** | Replaces localStorage — cross-device profile, streaks, XP, ELO, battle history, leaderboard. |
| **BigQuery** | Computes the trend signal from public developer-activity datasets; precomputed daily, not queried live per request. |
| **ADK** | Orchestrates the Trend, Curriculum, and Coach agents. |
| **Cloud Run** | Deployment target, scale-to-zero. |

Data sources: `bigquery-public-data.stackoverflow` (tag volume/growth — e.g. spikes in `rag`, `vector-database`, `fine-tuning`) and `bigquery-public-data.hacker_news` (AI/ML discussion volume), both free public datasets.

## Gamification Roadmap

Preethi and Anuhya are committing to the full set below by Sep 7 — grouped by what each mechanic reinforces.

**Quiz & Battle Formats**
- 1v1 Battle Royale — real-time head-to-head quiz vs. another user or bot, ELO-adjusted
- Matrix Mode — grid of concept tiles, race to clear rows/columns, Codenames-style
- Boss fights — weekly harder quiz gated behind a streak/XP threshold
- Speed rounds — 60-second rapid-fire true/false on the day's Pulse trends
- Debug the code — spot-the-bug challenges in short RAG/agent pipeline snippets

**Progression & Identity**
- Skill tree — visual map of ML domains (NLP, CV, agents, MLOps) that unlocks as weak spots close
- Badges & titles — "RAG Rookie" to "Agent Architect," shown on a public profile
- Penguin evolution — mascot visually levels up and gains gear as streak and XP grow

**Social & Competitive**
- Leaderboards — daily / weekly / all-time, filterable by company or friend group
- Guilds / squads — small teams sharing one streak goal
- Challenge a friend — send a specific Battle quiz link, async score comparison

**Retention Mechanics**
- Streak freeze — one free skip a week so a missed day doesn't break a long streak
- Daily surprise drop — random bonus XP or a wildcard question from an unexpected topic
- Fluency score card — shareable weekly snapshot from the Coach Agent, built to be posted outward

## Status & Timeline

The core app already runs end to end — React/Vite/Express, Gemini API wired in for dynamic content. This Build Phase layers in real persistence, the trend pipeline, and agent orchestration.

| Date | Milestone |
|---|---|
| Aug 20 | Idea locked, Firestore migration started — Touchpoint 1 submitted |
| Aug 28 | Checkpoint 2: BigQuery trend pipeline and Curriculum Agent working end to end |
| Sep 5 | Final checkpoint: Interviewer/Coach agents complete, deployed on Cloud Run, polish pass |
| Sep 7 | Lock submission — no extensions |

---

hAIbuild — Preethi & Anuhya
preethi582k1@gmail.com
anuhya1727@gmail.com