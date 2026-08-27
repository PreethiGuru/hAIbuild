import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error('VITE_FIREBASE_PROJECT_ID is not set in .env.local');
}

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();
const bigquery = new BigQuery({ projectId: PROJECT_ID });

const QUERY = fs.readFileSync(
  path.join(__dirname, '..', 'bigquery', '02_hackernews_trends.sql'),
  'utf8'
);

async function main() {
  console.log('Running Hacker News trend query...');
  const [rows] = await bigquery.query({ query: QUERY });

  const topics = rows.map((r: any) => ({
    topic: r.topic,
    recentMentions: Number(r.recent_mentions),
    recentScore: Number(r.recent_score),
    baselineMentions: Number(r.baseline_mentions),
    growthRatio: Number(r.growth_ratio ?? 0),
  }));

  await db.collection('trends').doc('pulse').set({
    topics,
    computedAt: new Date().toISOString(),
    source: 'bigquery-public-data.hacker_news.full',
  });

  console.log(`Wrote ${topics.length} trending topics to trends/pulse`);
  topics
    .slice(0, 5)
    .forEach((t) => console.log(`  ${t.topic}: ${t.recentMentions} mentions, growth ${t.growthRatio}x`));
}

main().catch((err) => {
  console.error('Failed to compute daily pulse:', err);
  process.exit(1);
});
