
import { genkit, type GenkitPlugin } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [];
const googleApiKey = process.env.GOOGLE_API_KEY;

const placeholders = [
    "YOUR_GOOGLE_AI_KEY_HERE", // from .env
    "", // Empty string
    undefined
];

const isPlaceholderOrMissing = (value: string | undefined): boolean => {
  return !value || placeholders.includes(value);
};

if (!isPlaceholderOrMissing(googleApiKey)) {
  try {
    plugins.push(googleAI());
    console.info("Genkit Google AI plugin initialized.");
  } catch (e) {
    console.warn("Failed to initialize Google AI plugin for Genkit, even with API key present. AI features may be affected. Error:", e);
  }
} else {
  console.warn(
    "GOOGLE_API_KEY is missing, a placeholder, or empty. " +
    "Genkit Google AI features will be limited or disabled. " +
    "Provide a valid key in .env to enable AI functionality."
  );
}

let genkitAiInstance;

try {
  genkitAiInstance = genkit({
    plugins: plugins,
    model: plugins.length > 0 ? 'googleai/gemini-2.0-flash' : undefined, // Only set model if a provider is available
    // Setting a default model without a corresponding plugin can cause errors.
    // Genkit might handle this, or it might be better to set model dynamically or in flows.
  });
} catch (e) {
  console.error("Critical error during Genkit initialization:", e);
  console.warn("Genkit features will be unavailable. Using a dummy AI instance.");
  // Create a dummy 'ai' object so imports don't break, but operations will fail predictably.
  const uninitializedError = () => Promise.reject(new Error("Genkit not initialized or AI provider missing. Check API keys."));
  genkitAiInstance = {
    defineFlow: () => uninitializedError,
    definePrompt: () => () => uninitializedError, // definePrompt returns a function
    generate: uninitializedError,
    generateStream: () => ({ stream: (async function*() {})(), response: uninitializedError() }),
    defineTool: () => uninitializedError,
    // Add other methods your application might use from `ai` if necessary
  } as any; // Using 'as any' for the dummy object structure
}

export const ai = genkitAiInstance;

