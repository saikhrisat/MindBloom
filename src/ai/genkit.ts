
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to read the API key from the environment variables.
// This is important because this file can be used in server-side contexts (e.g., Genkit flows).
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  // In a production environment (like Netlify), if the API key is missing,
  // log a warning. AI features will likely fail.
  console.warn(
    'WARNING: GOOGLE_API_KEY environment variable is not set. AI features may not work.'
  );
}

export const ai = genkit({
  plugins: [
    // Pass the apiKey explicitly to the googleAI plugin if it's available.
    // If apiKey is undefined, googleAI() will be called without specific config,
    // allowing it to try its default methods of finding credentials (which might be what's failing).
    apiKey ? googleAI({apiKey}) : googleAI(),
  ],
  // It's good practice to also define a default model for Genkit instance.
  model: 'googleai/gemini-2.0-flash', 
});
