'use server';

/**
 * @fileOverview Generates a weekly summary of the user's time allocation and energy levels using AI.
 *
 * - generateWeeklySummary - A function that generates the weekly summary.
 * - WeeklySummaryInput - The input type for the generateWeeklySummary function.
 * - WeeklySummaryOutput - The return type for the generateWeeklySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklySummaryInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  startDate: z.string().describe('The start date of the week (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the week (YYYY-MM-DD).'),
  taskLogs: z.string().describe('JSON string of all task logs for the week.'),
});
export type WeeklySummaryInput = z.infer<typeof WeeklySummaryInputSchema>;

const WeeklySummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the user\'s time allocation and energy levels for the week.'),
  suggestions: z.string().describe('Productivity tips based on the user\'s patterns.'),
});
export type WeeklySummaryOutput = z.infer<typeof WeeklySummaryOutputSchema>;

export async function generateWeeklySummary(input: WeeklySummaryInput): Promise<WeeklySummaryOutput> {
  return weeklySummaryFlow(input);
}

const weeklySummaryPrompt = ai.definePrompt({
  name: 'weeklySummaryPrompt',
  input: {schema: WeeklySummaryInputSchema},
  output: {schema: WeeklySummaryOutputSchema},
  prompt: `You are an AI productivity assistant. Generate a weekly summary of the user's time allocation and energy levels, and provide productivity tips based on their patterns.

  User ID: {{{userId}}}
  Start Date: {{{startDate}}}
  End Date: {{{endDate}}}
  Task Logs: {{{taskLogs}}}

  Summary:
  Suggestions: `,
});

const weeklySummaryFlow = ai.defineFlow(
  {
    name: 'weeklySummaryFlow',
    inputSchema: WeeklySummaryInputSchema,
    outputSchema: WeeklySummaryOutputSchema,
  },
  async input => {
    const {output} = await weeklySummaryPrompt(input);
    return output!;
  }
);
