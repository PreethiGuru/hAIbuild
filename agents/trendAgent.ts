import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { z } from 'zod';

const trendOutputSchema = z.object({
  topics: z
    .array(
      z.object({
        topic: z.string().describe('A short, specific AI/ML topic name.'),
        whyItMatters: z
          .string()
          .describe('One sentence on why this matters right now, for a software professional.'),
      })
    )
    .max(5),
});

export type TrendSummary = z.infer<typeof trendOutputSchema>;

interface PulseTopic {
  topic: string;
  recentMentions: number;
  growthRatio: number;
}

interface FoundationalTopic {
  tag: string;
  questionCount: number;
}

const trendAgent = new LlmAgent({
  name: 'trend_agent',
  model: 'gemini-3.6-flash',
  description: 'Synthesizes raw BigQuery trend data into a ranked, explained topic list.',
  instruction: `You are given raw developer-activity data on AI/ML topics, pulled from
BigQuery public datasets. It has two parts: "pulse" (recent Hacker News mention volume
and growth ratio vs. a prior period -- a live recency signal) and "foundational"
(all-time Stack Overflow question volume for core ML concepts -- an importance signal,
not a recency one, since that dataset is frozen).

Pick the 5 most worth-knowing-about topics for someone trying to stay current in AI/ML,
weighting the live "pulse" signal heavily (that is what "trending" means), and only
pulling from "foundational" if it adds something the pulse data doesn't already cover.
For each, write one sentence on why it matters right now -- concrete, not generic.`,
  outputSchema: trendOutputSchema,
});

export async function synthesizeTrends(
  pulseTopics: PulseTopic[],
  foundationalTopics: FoundationalTopic[]
): Promise<TrendSummary> {
  const runner = new InMemoryRunner({ agent: trendAgent, appName: 'haibuild-trend-agent' });

  const prompt = JSON.stringify({ pulse: pulseTopics, foundational: foundationalTopics });

  let finalText: string | undefined;
  for await (const event of runner.runEphemeral({
    userId: 'system',
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    const err = (event as any).errorCode || (event as any).errorMessage;
    if (err) {
      throw new Error(`Trend agent error: ${(event as any).errorCode} ${(event as any).errorMessage}`);
    }
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }

  if (!finalText) {
    throw new Error('Trend agent produced no final response.');
  }

  const cleaned = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return trendOutputSchema.parse(JSON.parse(cleaned));
}
