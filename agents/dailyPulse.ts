import { getDb } from './firebaseAdmin';
import { synthesizeTrends } from './trendAgent';
import { writePulseBriefing, PulseContent } from './curriculumAgent';

function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailyPulse extends PulseContent {
  date: string;
  computedAt: string;
}

export async function getTodayPulse(): Promise<DailyPulse> {
  const db = getDb();
  const today = getTodayDateString();
  const cacheRef = db.collection('pulse').doc(today);
  const cached = await cacheRef.get();

  if (cached.exists) {
    return cached.data() as DailyPulse;
  }

  const [pulseSnap, foundationalSnap] = await Promise.all([
    db.collection('trends').doc('pulse').get(),
    db.collection('trends').doc('foundational').get(),
  ]);

  const pulseTopics = (pulseSnap.data()?.topics ?? []).slice(0, 10);
  const foundationalTopics = (foundationalSnap.data()?.topics ?? []).slice(0, 10);

  const trendSummary = await synthesizeTrends(pulseTopics, foundationalTopics);
  const content = await writePulseBriefing(trendSummary);

  const result: DailyPulse = {
    ...content,
    date: today,
    computedAt: new Date().toISOString(),
  };

  await cacheRef.set(result);
  return result;
}
