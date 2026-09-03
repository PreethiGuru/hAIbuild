import { getDb } from './firebaseAdmin';
import { computeFluencyScore, FluencyScore, FluencyStats } from './fluencyScore';
import { writeCoachReport, CoachReportContent } from './coachAgent';

export interface CoachReport extends CoachReportContent {
  fluency: FluencyScore;
  weekIndex: number;
  computedAt: string;
}

const MS_PER_DAY = 86400000;

function currentWeekIndex(): number {
  return Math.floor(Math.floor(Date.now() / MS_PER_DAY) / 7);
}

/**
 * Returns this week's coach report for a user, generating it only once per
 * week per user and caching it at users/{uid}/coachReports/{weekIndex}.
 * The report is explicitly a *weekly* readiness snapshot, so regenerating it
 * on every page view would both contradict that framing and burn rate limit.
 */
export async function getWeeklyCoachReport(uid: string, stats: FluencyStats): Promise<CoachReport> {
  const db = getDb();
  const weekIndex = currentWeekIndex();
  const cacheRef = db.collection('users').doc(uid).collection('coachReports').doc(String(weekIndex));

  const cached = await cacheRef.get();
  if (cached.exists) {
    return cached.data() as CoachReport;
  }

  const fluency = computeFluencyScore(stats);
  const content = await writeCoachReport(stats, fluency);

  const report: CoachReport = {
    ...content,
    fluency,
    weekIndex,
    computedAt: new Date().toISOString(),
  };

  await cacheRef.set(report);
  return report;
}
