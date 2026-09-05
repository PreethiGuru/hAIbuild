import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getTodayPulse } from './agents/dailyPulse';
import { getWeeklyCoachReport } from './agents/coachReport';
import { processLeagueWeek } from './agents/leagueProcessor';
import { refreshTrends } from './agents/trendRefresh';
import { getOrGenerate } from './agents/aiCache';

async function startServer() {
  const app = express();
  // Cloud Run injects PORT (8080 by default) and requires the container to
  // listen on it -- a hardcoded port fails to start there.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini API if API key exists
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  const GEMINI_MODEL = 'gemini-3.6-flash';

  /**
   * The free tier allows 20 generate_content calls per day for the whole
   * project, so exhaustion is a routine state, not an exception. Reporting it
   * as a generic failure sent users to "try again later" when the honest
   * answer is that the daily allowance is gone until tomorrow.
   */
  function isQuotaError(err: any): boolean {
    const status = err?.status ?? err?.code;
    return status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(String(err?.message ?? ''));
  }

  function quotaAwareStatus(err: any): number {
    return isQuotaError(err) ? 429 : 500;
  }

  function describeAiError(err: any): string {
    return isQuotaError(err)
      ? "Today's AI request limit for this project has been reached. The written explanation below is always available, and AI hints return tomorrow."
      : 'Could not reach the AI service just now. Please try again in a moment.';
  }

  // The client renders these answers as light Markdown (bold, code, lists).
  // LaTeX is the one thing it cannot typeset, and the model reaches for it
  // unprompted whenever complexity comes up -- "$O(1)$" instead of "O(1)".
  const PROSE_STYLE_RULE =
    'Write plain prose. Do not use LaTeX or dollar-sign math notation: write complexities as plain text such as O(1) or O(n log n). Bold and inline code are fine.';

  // API Route: Health check & AI status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGemini: Boolean(apiKey),
    });
  });

  // API Route: Today's Pulse (Trend Agent -> Curriculum Agent, cached in Firestore)
  app.get('/api/pulse/today', async (req, res) => {
    try {
      const pulse = await getTodayPulse();
      return res.json({ success: true, pulse });
    } catch (err: any) {
      console.error('Error computing daily pulse:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to compute daily pulse.' });
    }
  });

  // API Route: Weekly Coach report (Coach Agent, cached per user per week)
  app.post('/api/coach/report', async (req, res) => {
    const { uid, stats } = req.body ?? {};
    if (!uid || !stats) {
      return res.status(400).json({ success: false, error: 'Missing uid or stats.' });
    }
    try {
      const report = await getWeeklyCoachReport(uid, stats);
      return res.json({ success: true, report });
    } catch (err: any) {
      console.error('Error generating coach report:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to generate coach report.' });
    }
  });

  // --- Scheduled jobs (Cloud Scheduler) ---------------------------------
  //
  // These mutate shared state for every user, so they are gated on a shared
  // secret sent by the scheduler rather than left open on a public URL. The
  // comparison is length-safe: a missing or wrong-length header fails before
  // any work is done. If SCHEDULER_SECRET is unset the routes refuse outright
  // instead of defaulting to open.
  const schedulerSecret = process.env.SCHEDULER_SECRET;

  function isAuthorizedJob(req: express.Request): boolean {
    if (!schedulerSecret) return false;
    const provided = req.get('X-Scheduler-Secret');
    return typeof provided === 'string' && provided === schedulerSecret;
  }

  // Daily: re-run the BigQuery trend query, then regenerate the Pulse from it.
  app.post('/api/jobs/refresh-pulse', async (req, res) => {
    if (!isAuthorizedJob(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    try {
      const trends = await refreshTrends();
      const pulse = await getTodayPulse({ force: true });
      return res.json({ success: true, trends, pulseDate: pulse.date });
    } catch (err: any) {
      console.error('Scheduled pulse refresh failed:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Pulse refresh failed.' });
    }
  });

  // Weekly, Sunday 00:00 IST: settle the league -- rank each division by the
  // week's XP, promote/demote, pay out Snowflakes, reset weekly totals.
  app.post('/api/jobs/process-league', async (req, res) => {
    if (!isAuthorizedJob(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    try {
      const summary = await processLeagueWeek({ force: Boolean(req.body?.force) });
      return res.json({ success: true, summary });
    } catch (err: any) {
      console.error('Scheduled league processing failed:', err);
      return res.status(500).json({ success: false, error: err?.message || 'League processing failed.' });
    }
  });

  // API Route: Generate AI Battle Question
  app.post('/api/gemini/battle-question', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key not configured.' });
    }

    try {
      const difficulties = ['junior', 'mid', 'senior'];
      const chosenDiff = difficulties[Math.floor(Math.random() * difficulties.length)];

      const prompt = `Generate one AIML interview multiple-choice question.
Difficulty: ${chosenDiff}.
Return JSON only, no markdown formatting, no codeblocks, in this exact shape:
{
  "question": "string",
  "difficulty": "${chosenDiff}",
  "shortAnswer": "string",
  "fullExplanation": "string",
  "whyItMattersInInterviews": "string",
  "battleFormat": {
    "prompt": "string",
    "options": ["string", "string", "string", "string"],
    "correctOptionIndex": 0
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const rawText = response.text || '';
      // Clean potential code block wrapping
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Error generating AI question:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to generate AI question.' });
    }
  });

  // API Route: AI Hint for DSA Problem
  app.post('/api/gemini/hint', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key not configured.' });
    }

    const { problemStatement } = req.body;
    if (!problemStatement) {
      return res.status(400).json({ success: false, error: 'Missing problem statement.' });
    }

    try {
      const prompt = `Give a short (2-3 sentence) hint for solving this DSA problem without revealing the direct solution code.
Problem: ${problemStatement}

${PROSE_STYLE_RULE}`;

      // Cached on the problem text: every user sees the same daily problem, so
      // this is one generation shared by everyone rather than one per view.
      const { text } = await getOrGenerate('hint', problemStatement, async () => {
        const response = await ai!.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });
        return response.text || '';
      });

      return res.json({ success: true, hint: text });
    } catch (err: any) {
      console.error('Error generating AI hint:', err);
      return res.status(quotaAwareStatus(err)).json({ success: false, error: describeAiError(err) });
    }
  });

  // API Route: AI Elaboration for ML Concept / Q&A
  app.post('/api/gemini/elaborate', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key not configured.' });
    }

    const { question, shortAnswer } = req.body;
    if (!question || !shortAnswer) {
      return res.status(400).json({ success: false, error: 'Missing question or short answer.' });
    }

    try {
      const prompt = `Explain this ML concept in simpler terms with a concrete real-world example a junior engineer would understand.
Concept/Question: ${question}
Answer: ${shortAnswer}

${PROSE_STYLE_RULE}`;

      const { text } = await getOrGenerate('elaborate', `${question}
${shortAnswer}`, async () => {
        const response = await ai!.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });
        return response.text || '';
      });

      return res.json({ success: true, elaboration: text });
    } catch (err: any) {
      console.error('Error generating AI elaboration:', err);
      return res.status(quotaAwareStatus(err)).json({ success: false, error: describeAiError(err) });
    }
  });

  // API Route: AI Daily Summary feedback for Profile
  app.post('/api/gemini/daily-summary', async (req, res) => {
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key not configured.' });
    }

    const { rating, streakCount, dsaSolvedCount, mlConceptsViewedCount, battlesPlayed, battlesWon } = req.body;

    try {
      const prompt = `I am preparing for AIML interviews. My stats:
- ELO rating: ${rating || 1200} (started at 1200)
- Streak: ${streakCount || 0} days
- DSA solved: ${dsaSolvedCount || 0}, ML concepts: ${mlConceptsViewedCount || 0}, Battles: ${battlesPlayed || 0} won ${battlesWon || 0}

Give me 2-3 sentences of honest, encouraging feedback and one specific target topic or habit I should focus on this week.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      return res.json({ success: true, summary: response.text });
    } catch (err: any) {
      console.error('Error generating AI daily summary:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate AI feedback.' });
    }
  });

  // Serve Vite Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          // Bundle filenames carry a content hash, so a given name's contents
          // never change and it can be cached indefinitely.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (filePath.endsWith('index.html')) {
            // Set here as well as on the fallback route below: this middleware
            // answers "/" itself and never reaches that handler.
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );

    app.get('*', (req, res) => {
      // Only extensionless paths are client-side routes. Without this check a
      // request for a bundle that no longer exists -- exactly what a browser
      // holding an index.html from a previous deploy asks for -- falls through
      // to the SPA shell and is answered with HTML under a 200. The browser
      // then parses that HTML as JavaScript, throws, and renders a blank page
      // instead of recovering. A real 404 lets it fail honestly.
      if (path.extname(req.path)) {
        return res.status(404).send('Not found');
      }

      // The shell names the hashed bundles, so a stale copy points at files
      // that are gone. Always revalidate it, even though the assets it
      // references are cached hard.
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
