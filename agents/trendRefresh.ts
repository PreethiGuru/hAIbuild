import fs from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';
import { getDb } from './firebaseAdmin';

export interface TrendTopic {
  topic: string;
  recentMentions: number;
  recentScore: number;
  baselineMentions: number;
  growthRatio: number;
}

export interface TrendRefreshSummary {
  topicCount: number;
  topTopics: string[];
  computedAt: string;
}

const SQL_RELATIVE_PATH = path.join('bigquery', '02_hackernews_trends.sql');

/**
 * The query lives in bigquery/ so it stays runnable by hand in the BigQuery
 * console, which means locating it at runtime rather than inlining it. The
 * bundled server runs from dist/ with the app root as cwd, so cwd is the
 * normal hit; the parent is a fallback in case the process is started from
 * inside dist/ instead.
 */
function readTrendQuery(): string {
  const candidates = [
    path.join(process.cwd(), SQL_RELATIVE_PATH),
    path.join(process.cwd(), '..', SQL_RELATIVE_PATH),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf8');
  }
  throw new Error(`Could not locate ${SQL_RELATIVE_PATH} (looked in: ${candidates.join(', ')})`);
}

/**
 * Re-runs the Hacker News trend query and republishes trends/pulse. Run on a
 * daily schedule rather than per request: the BigQuery scan is the expensive
 * part of the pipeline, and every reader of trends/pulse wants the same
 * answer for the same day.
 */
export async function refreshTrends(): Promise<TrendRefreshSummary> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('VITE_FIREBASE_PROJECT_ID is not set');
  }

  const bigquery = new BigQuery({ projectId });
  const [rows] = await bigquery.query({ query: readTrendQuery() });

  const topics: TrendTopic[] = rows.map((r: any) => ({
    topic: r.topic,
    recentMentions: Number(r.recent_mentions),
    recentScore: Number(r.recent_score),
    baselineMentions: Number(r.baseline_mentions),
    growthRatio: Number(r.growth_ratio ?? 0),
  }));

  const computedAt = new Date().toISOString();
  await getDb().collection('trends').doc('pulse').set({
    topics,
    computedAt,
    source: 'bigquery-public-data.hacker_news.full',
  });

  return {
    topicCount: topics.length,
    topTopics: topics.slice(0, 5).map((t) => t.topic),
    computedAt,
  };
}
