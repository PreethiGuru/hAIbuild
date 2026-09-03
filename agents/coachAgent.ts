import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { z } from 'zod';
import { FluencyScore, FluencyStats } from './fluencyScore';

const coachOutputSchema = z.object({
  assessment: z
    .string()
    .describe('2-3 sentences on where this learner actually stands. Direct and specific, not generic praise.'),
  focusAreas: z
    .array(
      z.object({
        title: z.string().describe('A short, concrete focus area, under 6 words.'),
        why: z.string().describe('One sentence on why this is the highest-leverage next step for them.'),
      })
    )
    .max(3),
});

export type CoachReportContent = z.infer<typeof coachOutputSchema>;

const coachAgent = new LlmAgent({
  name: 'coach_agent',
  model: 'gemini-3.6-flash',
  description: "Writes a learner's weekly AI/ML readiness report from their real activity stats.",
  instruction: `You are the coach for hAIbuild, an app that builds daily AI/ML fluency.

You are given a learner's real activity stats and a fluency score that was already
computed from those stats by a fixed formula (you did NOT compute it -- do not
contradict it or invent a different number). The score's five components are:
consistency (streak, /30), breadth (how many of the 7 activity types they've touched,
/20), depth (total volume, /25), competitive (ELO above the 1200 baseline, /15), and
accuracy (battle win rate, /10).

Write an honest, specific assessment of where they stand, then pick at most 3 focus
areas that would move their score most. Look at which score components are weakest and
target those concretely -- e.g. if breadth is low, name the specific modes they haven't
tried; if consistency is low, talk about the streak. Be direct and encouraging without
being fluffy. Never invent stats you weren't given.`,
  outputSchema: coachOutputSchema,
});

export async function writeCoachReport(
  stats: FluencyStats,
  fluency: FluencyScore
): Promise<CoachReportContent> {
  const runner = new InMemoryRunner({ agent: coachAgent, appName: 'haibuild-coach-agent' });

  const prompt = JSON.stringify({ stats, fluency });

  let finalText: string | undefined;
  for await (const event of runner.runEphemeral({
    userId: 'system',
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    const err = (event as any).errorCode || (event as any).errorMessage;
    if (err) {
      throw new Error(`Coach agent error: ${(event as any).errorCode} ${(event as any).errorMessage}`);
    }
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }

  if (!finalText) {
    throw new Error('Coach agent produced no final response.');
  }

  const cleaned = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return coachOutputSchema.parse(JSON.parse(cleaned));
}
