'use server';
/**
 * @fileOverview An AI agent that analyzes real-time synthetic index data to recommend profitable entry points for automated trades.
 *
 * - aiMarketSignalRecommendation - A function that handles the market signal recommendation process.
 * - AiMarketSignalRecommendationInput - The input type for the aiMarketSignalRecommendation function.
 * - AiMarketSignalRecommendationOutput - The return type for the aiMarketSignalRecommendation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiMarketSignalRecommendationInputSchema = z.object({
  indexName: z.string().describe('The name of the synthetic index (e.g., Boom 500, Crash 1000, Volatility 75).'),
  currentPrice: z.number().describe('The current price of the synthetic index.'),
  marketTrend: z.string().describe('Current market trend (e.g., "bullish", "bearish", "sideways").'),
  indexData: z.string().describe('Real-time synthetic index data for analysis, formatted as a descriptive string.'),
});
export type AiMarketSignalRecommendationInput = z.infer<typeof AiMarketSignalRecommendationInputSchema>;

const AiMarketSignalRecommendationOutputSchema = z.object({
  action: z.enum(['buy', 'sell', 'hold']).describe('Recommended trading action (buy, sell, or hold).'),
  entryPrice: z.number().describe('The recommended entry price for the trade.'),
  confidence: z.number().min(0).max(1).describe('Confidence level of the recommendation (0-1).'),
  recommendationRationale: z.string().describe('A detailed explanation of why this recommendation is given.'),
});
export type AiMarketSignalRecommendationOutput = z.infer<typeof AiMarketSignalRecommendationOutputSchema>;

export async function aiMarketSignalRecommendation(input: AiMarketSignalRecommendationInput): Promise<AiMarketSignalRecommendationOutput> {
  return aiMarketSignalRecommendationFlow(input);
}

const aiMarketSignalRecommendationPrompt = ai.definePrompt({
  name: 'aiMarketSignalRecommendationPrompt',
  input: { schema: AiMarketSignalRecommendationInputSchema },
  output: { schema: AiMarketSignalRecommendationOutputSchema },
  prompt: `You are an expert financial analyst specializing in synthetic index trading. Your task is to analyze the provided real-time synthetic index data for {{indexName}} and recommend the most profitable entry point for an automated trade.

Current Index: {{indexName}}
Current Price: {{currentPrice}}
Market Trend: {{marketTrend}}
Index Data: {{{indexData}}}

Based on this data, provide a clear, actionable trading recommendation including the recommended action (buy, sell, or hold), the entry price, a confidence score (0-1), and a detailed rationale. The recommendation should be geared towards maximizing profitability given the current market conditions. Provide your output in the specified JSON format.`,
});

const aiMarketSignalRecommendationFlow = ai.defineFlow(
  {
    name: 'aiMarketSignalRecommendationFlow',
    inputSchema: AiMarketSignalRecommendationInputSchema,
    outputSchema: AiMarketSignalRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await aiMarketSignalRecommendationPrompt(input);
    return output!;
  }
);
