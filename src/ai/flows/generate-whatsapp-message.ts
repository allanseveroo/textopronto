'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating WhatsApp sales messages.
 *
 * The flow takes a sales tag and niche details as input and generates a customized WhatsApp message.
 * It exports the GenerateWhatsAppMessage function, the GenerateWhatsAppMessageInput type, and the GenerateWhatsAppMessageOutput type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsAppMessageInputSchema = z.object({
  salesTag: z
    .string()
    .describe('The sales tag to use for the message (e.g., greeting, promotion, objection).'),
  nicheDetails: z
    .string()
    .describe('Specific details about the niche or product for the sales message.'),
});
export type GenerateWhatsAppMessageInput = z.infer<typeof GenerateWhatsAppMessageInputSchema>;

const GenerateWhatsAppMessageOutputSchema = z.object({
  message: z.string().describe('The generated WhatsApp sales message.'),
});
export type GenerateWhatsAppMessageOutput = z.infer<typeof GenerateWhatsAppMessageOutputSchema>;

export async function generateWhatsAppMessage(
  input: GenerateWhatsAppMessageInput
): Promise<GenerateWhatsAppMessageOutput> {
  return generateWhatsAppMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsAppMessagePrompt',
  input: {schema: GenerateWhatsAppMessageInputSchema},
  output: {schema: GenerateWhatsAppMessageOutputSchema},
  prompt: `You are an AI assistant specialized in generating WhatsApp sales messages.

  Based on the provided sales tag and niche details, create a compelling and ready-to-use WhatsApp message.

  Sales Tag: {{{salesTag}}}
  Niche Details: {{{nicheDetails}}}

  Message:`,
});

const generateWhatsAppMessageFlow = ai.defineFlow(
  {
    name: 'generateWhatsAppMessageFlow',
    inputSchema: GenerateWhatsAppMessageInputSchema,
    outputSchema: GenerateWhatsAppMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
