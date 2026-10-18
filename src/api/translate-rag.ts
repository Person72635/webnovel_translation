import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pipeline } from '@xenova/transformers';
import { Pool } from 'pg';

// --- Configuration ---
const EMBEDDING_MODEL = 'Xenova/multilingual-e5-large';
const CONTEXT_WINDOW_SIZE = 2; // Number of previous chunks to include for context
const PROMPT_TEMPLATE = `
Given the following context chunks and recent translations, translate the current text into English with a similar style.

Recent translations for context:
{recent_context}

Corpus examples:
{corpus_context}

Current text: "{current_text}"

Translation:
`;

// Initialize DB connection
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

interface DocumentRow {
  chinese_text: string;
  english_text: string;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

// Function to chunk text by paragraphs
const chunkByParagraphs = (text: string): string[] => {
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p);
  return paragraphs;
};

// Function to get relevant context from the database
const getContext = async (embedding: number[], mode: string) => {
  const client = await pool.connect();
  try {
    let k = 3; // Default for 'balanced' mode
    if (mode === 'cost_saver') k = 1;
    if (mode === 'quality') k = 5;

    const { rows } = await client.query<DocumentRow>(
      'SELECT chinese_text, english_text FROM gaworare ORDER BY embedding <=> $1 LIMIT $2',
      [`[${embedding.join(',')}]`, k]
    );

    return rows.map(row => `Chinese: ${row.chinese_text}\nEnglish: ${row.english_text}`).join('\n\n');
  } finally {
    client.release();
  }
};

// Main serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, mode = 'balanced', api_key: apiKey } = req.body;

  if (!query || !apiKey) {
    return res.status(400).json({ error: 'Missing required parameters: query and api_key.' });
  }

  try {
    console.log('Starting translation process...');

    // 1. Chunk the input by paragraphs
    const inputChunks = chunkByParagraphs(query);
    console.log(`Input split into ${inputChunks.length} paragraphs.`);

    if (inputChunks.length === 0) {
      return res.status(400).json({ error: 'No valid text to translate.' });
    }

    // 2. Load embedding model once
    console.log('Loading embedding model...');
    const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, { quantized: true });
    console.log('Embedding model loaded.');

    // 3. Process each chunk with context window
    const translations: string[] = [];
    const contextWindow: string[] = [];

    for (let i = 0; i < inputChunks.length; i++) {
      const chunk = inputChunks[i];
      console.log(`Processing chunk ${i + 1}/${inputChunks.length}...`);

      // Generate embedding for this chunk
      const chunkEmbedding = await extractor(chunk, { pooling: 'mean', normalize: true });
      const vector = Array.from(chunkEmbedding.data) as number[];

      // Retrieve corpus context
      const corpusContext = await getContext(vector, mode);

      // Get recent translation context (sliding window)
      const recentContext = contextWindow.slice(-CONTEXT_WINDOW_SIZE).join('\n\n');

      // Construct prompt
      const prompt = PROMPT_TEMPLATE
        .replace('{recent_context}', recentContext || 'None (first chunk)')
        .replace('{corpus_context}', corpusContext)
        .replace('{current_text}', chunk);

      // Call Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!geminiRes.ok) {
        const errorBody = await geminiRes.text();
        console.error(`[Gemini] API Error for chunk ${i + 1}: ${geminiRes.status}`, errorBody);
        throw new Error(`Gemini API request failed for chunk ${i + 1} with status ${geminiRes.status}`);
      }

      const geminiData = await geminiRes.json() as GeminiResponse;
      const translation = geminiData.candidates[0]?.content?.parts[0]?.text.trim() || '';

      if (!translation) {
        console.warn(`Chunk ${i + 1} returned empty translation.`);
      }

      translations.push(translation);
      contextWindow.push(translation);
      console.log(`Chunk ${i + 1} translated.`);
    }

    // 4. Combine all translations
    const finalTranslation = translations.join('\n\n');
    console.log('All chunks translated and combined.');

    return res.status(200).json({ translation: finalTranslation });

  } catch (error) {
    console.error('An error occurred in the translation process:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to process translation.', details: errorMessage });
  }
};
