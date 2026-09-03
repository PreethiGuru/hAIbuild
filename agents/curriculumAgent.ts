import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { z } from 'zod';
import type { TrendSummary } from './trendAgent';

const pulseContentSchema = z.object({
  headline: z.string().describe('A short, punchy headline for today\'s Pulse, under 8 words.'),
  briefing: z
    .string()
    .describe('2-3 sentences summarizing what is happening in AI/ML right now and why it matters.'),
  topics: z.array(z.string()).max(5).describe('The topic names this briefing covers.'),
});

export type PulseContent = z.infer<typeof pulseContentSchema>;

const curriculumAgent = new LlmAgent({
  name: 'curriculum_agent',
  model: 'gemini-3.6-flash',
  description: "Turns a ranked trend summary into today's Pulse briefing for the app.",
  instruction: `You are the daily "Pulse" writer for hAIbuild, an app that helps software
professionals stay fluent in AI/ML in about 10 minutes a day. You are given a ranked list
of trending AI/ML topics with reasons they matter. Write one cohesive, engaging briefing --
not a bullet list of the inputs verbatim, but a short narrative a busy engineer would
actually enjoy reading over coffee. Keep it grounded in the given topics; do not invent
new ones.`,
  outputSchema: pulseContentSchema,
});

export async function writePulseBriefing(trendSummary: TrendSummary): Promise<PulseContent> {
  const runner = new InMemoryRunner({ agent: curriculumAgent, appName: 'haibuild-curriculum-agent' });

  const prompt = JSON.stringify(trendSummary);

  let finalText: string | undefined;
  for await (const event of runner.runEphemeral({
    userId: 'system',
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    const err = (event as any).errorCode || (event as any).errorMessage;
    if (err) {
      throw new Error(`Curriculum agent error: ${(event as any).errorCode} ${(event as any).errorMessage}`);
    }
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }

  if (!finalText) {
    throw new Error('Curriculum agent produced no final response.');
  }

  const cleaned = finalText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return pulseContentSchema.parse(JSON.parse(cleaned));
}
