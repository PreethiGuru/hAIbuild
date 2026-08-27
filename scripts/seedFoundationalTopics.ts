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
  path.join(__dirname, '..', 'bigquery', '01_stackoverflow_foundational_topics.sql'),
  'utf8'
);

async function main() {
  console.log('Running Stack Overflow foundational-topics query...');
  const [rows] = await bigquery.query({ query: QUERY });

  const topics = rows.map((r: any) => ({
    tag: r.tag,
    questionCount: Number(r.question_count),
    totalViews: Number(r.total_views),
  }));

  await db.collection('trends').doc('foundational').set({
    topics,
    computedAt: new Date().toISOString(),
    source: 'bigquery-public-data.stackoverflow.posts_questions',
  });

  console.log(`Wrote ${topics.length} foundational topics to trends/foundational`);
  topics.slice(0, 5).forEach((t) => console.log(`  ${t.tag}: ${t.questionCount} questions`));
}

main().catch((err) => {
  console.error('Failed to seed foundational topics:', err);
  process.exit(1);
});
