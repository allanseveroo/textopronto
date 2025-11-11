'use server';

/**
 * @fileOverview A flow that suggests relevant niche details based on the selected sales tag.
 *
 * - suggestNicheDetails - A function that suggests niche details for a sales message.
 * - SuggestNicheDetailsInput - The input type for the suggestNicheDetails function.
 * - SuggestNicheDetailsOutput - The return type for the suggestNicheDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNicheDetailsInputSchema = z.object({
  salesTag: z
    .string()
    .describe('The selected sales tag (e.g., greeting, groups, objections).'),
});
export type SuggestNicheDetailsInput = z.infer<typeof SuggestNicheDetailsInputSchema>;

const SuggestNicheDetailsOutputSchema = z.object({
  suggestedDetails: z
    .string()
    .describe('Suggested niche details based on the sales tag.'),
});
export type SuggestNicheDetailsOutput = z.infer<typeof SuggestNicheDetailsOutputSchema>;

export async function suggestNicheDetails(input: SuggestNicheDetailsInput): Promise<SuggestNicheDetailsOutput> {
  return suggestNicheDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNicheDetailsPrompt',
  input: {schema: SuggestNicheDetailsInputSchema},
  output: {schema: SuggestNicheDetailsOutputSchema},
  prompt: `You are a sales expert. Based on the selected sales tag, suggest relevant niche details that the user can use to create a more effective sales message.\n\nSales Tag: {{{salesTag}}}\n\nSuggested Niche Details:`,
});

const suggestNicheDetailsFlow = ai.defineFlow(
  {
    name: 'suggestNicheDetailsFlow',
    inputSchema: SuggestNicheDetailsInputSchema,
    outputSchema: SuggestNicheDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
