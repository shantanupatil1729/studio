'use server';

/**
 * @fileOverview Provides AI-driven productivity suggestions based on user's logged data.
 *
 * - getProductivitySuggestions - A function that generates productivity suggestions.
 * - ProductivitySuggestionsInput - The input type for the getProductivitySuggestions function.
 * - ProductivitySuggestionsOutput - The return type for the getProductivitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductivitySuggestionsInputSchema = z.object({
  weeklySummary: z.string().describe('A summary of the user\'s weekly time and energy logs.'),
  userPreferences: z.string().optional().describe('Any user preferences or goals.'),
});
export type ProductivitySuggestionsInput = z.infer<typeof ProductivitySuggestionsInputSchema>;

const ProductivitySuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of productivity suggestions tailored to the user\'s data.'),
});
export type ProductivitySuggestionsOutput = z.infer<typeof ProductivitySuggestionsOutputSchema>;

export async function getProductivitySuggestions(input: ProductivitySuggestionsInput): Promise<ProductivitySuggestionsOutput> {
  return productivitySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productivitySuggestionsPrompt',
  input: {schema: ProductivitySuggestionsInputSchema},
  output: {schema: ProductivitySuggestionsOutputSchema},
  prompt: `You are a productivity expert. Based on the following weekly summary of the user\'s time and energy logs, and their stated preferences, provide a list of actionable productivity suggestions.

Weekly Summary: {{{weeklySummary}}}
User Preferences: {{{userPreferences}}}

Suggestions:`,
});

const productivitySuggestionsFlow = ai.defineFlow(
  {
    name: 'productivitySuggestionsFlow',
    inputSchema: ProductivitySuggestionsInputSchema,
    outputSchema: ProductivitySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
