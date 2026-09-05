import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { initializeApp, getApps } from 'firebase-admin/app';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error('VITE_FIREBASE_PROJECT_ID is not set in .env.local');
}

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

// Imported after initializeApp so the shared admin handle is ready.
const { refreshTrends } = await import('../agents/trendRefresh');

async function main() {
  console.log('Running Hacker News trend query...');
  const summary = await refreshTrends();
  console.log(`Wrote ${summary.topicCount} trending topics to trends/pulse`);
  console.log(`  Top: ${summary.topTopics.join(', ')}`);
}

main().catch((err) => {
  console.error('Failed to compute daily pulse:', err);
  process.exit(1);
});
