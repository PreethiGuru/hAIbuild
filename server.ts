import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getTodayPulse } from './agents/dailyPulse';
import { getWeeklyCoachReport } from './agents/coachReport';

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
Problem: ${problemStatement}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      return res.json({ success: true, hint: response.text });
    } catch (err: any) {
      console.error('Error generating AI hint:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate AI hint.' });
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
Answer: ${shortAnswer}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      return res.json({ success: true, elaboration: response.text });
    } catch (err: any) {
      console.error('Error generating AI elaboration:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate AI elaboration.' });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
