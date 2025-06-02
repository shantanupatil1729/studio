'use server';
/**
 * @fileOverview This file contains a Genkit flow for automatically categorizing user's qualitative energy input.
 *
 * - categorizeEnergy - A function that categorizes energy input.
 * - CategorizeEnergyInput - The input type for the categorizeEnergy function.
 * - CategorizeEnergyOutput - The return type for the categorizeEnergy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeEnergyInputSchema = z.object({
  energyInput: z
    .string()
    .describe("The user's qualitative input about their energy levels (e.g., 'feeling tired', 'deep focus')."),
});
export type CategorizeEnergyInput = z.infer<typeof CategorizeEnergyInputSchema>;

const CategorizeEnergyOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The automatically categorized energy level (e.g., positive, negative, neutral) based on the user input.'
    ),
  confidence: z
    .number()
    .describe('The confidence level (0-1) of the categorization, indicating the certainty of the AI.'),
});
export type CategorizeEnergyOutput = z.infer<typeof CategorizeEnergyOutputSchema>;

export async function categorizeEnergy(input: CategorizeEnergyInput): Promise<CategorizeEnergyOutput> {
  return categorizeEnergyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeEnergyPrompt',
  input: {schema: CategorizeEnergyInputSchema},
  output: {schema: CategorizeEnergyOutputSchema},
  prompt: `You are an AI assistant specializing in categorizing energy levels based on user input.

  Analyze the following user input and determine the most appropriate energy category (positive, negative, or neutral).
  Also, provide a confidence score (0-1) indicating the certainty of your categorization.

  User Input: {{{energyInput}}}
  Category: 
  Confidence: `,
});

const categorizeEnergyFlow = ai.defineFlow(
  {
    name: 'categorizeEnergyFlow',
    inputSchema: CategorizeEnergyInputSchema,
    outputSchema: CategorizeEnergyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
