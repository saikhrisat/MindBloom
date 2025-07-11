
// 'use server';

/**
 * @fileOverview AI-powered suggestion of child nodes for a mind map node.
 *
 * - suggestChildNodes - A function that suggests child nodes for a given parent node.
 * - SuggestChildNodesInput - The input type for the suggestChildNodes function.
 * - SuggestChildNodesOutput - The output type for the suggestChildNodes function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestChildNodesInputSchema = z.object({
  parentNodeText: z
    .string()
    .describe('The text content of the parent node for which to suggest child nodes.'),
  mindMapContext: z
    .string()
    .optional()
    .describe('Optional context of the overall mind map to guide suggestions.'),
  branchContext: z
    .string()
    .optional()
    .describe('Optional context of the current branch or path leading to the parent node, e.g., "Root > Category > Current Node".'),
  numberOfSuggestions: z
    .number()
    .default(3)
    .describe('The number of child node suggestions to generate.'),
});
export type SuggestChildNodesInput = z.infer<typeof SuggestChildNodesInputSchema>;

const SuggestChildNodesOutputSchema = z.object({
  suggestions: z.array(
    z.string().describe('Suggested child node text content.')
  ).describe('An array of suggested child nodes.')
});
export type SuggestChildNodesOutput = z.infer<typeof SuggestChildNodesOutputSchema>;

export async function suggestChildNodes(input: SuggestChildNodesInput): Promise<SuggestChildNodesOutput> {
  return suggestChildNodesFlow(input);
}

const suggestChildNodesPrompt = ai.definePrompt({
  name: 'suggestChildNodesPrompt',
  input: {schema: SuggestChildNodesInputSchema},
  output: {schema: SuggestChildNodesOutputSchema},
  prompt: `You are a mind map assistant that helps users brainstorm ideas.
  The user is working on a mind map node.
  The overall mind map context is: {{{mindMapContext}}}
  The current branch leading to the parent node is: {{{branchContext}}}
  The parent node text is: "{{{parentNodeText}}}".

  Please suggest {{numberOfSuggestions}} child nodes that would be relevant and helpful to expand on this parent node, considering its position within the branch and the overall mind map context.
  The suggestions should be concise and directly related to the parent node and its context.

  Return the suggestions as a JSON array of strings.
  `,
});

const suggestChildNodesFlow = ai.defineFlow(
  {
    name: 'suggestChildNodesFlow',
    inputSchema: SuggestChildNodesInputSchema,
    outputSchema: SuggestChildNodesOutputSchema,
  },
  async input => {
    const {output} = await suggestChildNodesPrompt(input);
    return output!;
  }
);

