import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// --- Configuration ---
const GEMINI_MODEL = 'gemini-embedding-001';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:embedContent`;
const CHUNK_SIZE = 5; // Number of paragraphs per chunk (matches database seeding)
const CONTEXT_WINDOW_SIZE = 2; // Number of previous chunks to include for context
const BLOCKED_CODES = new Set(['safety', 'prohibited_content', 'blocklist', 'jailbreak', 'spii', 'content_blocked']);
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

// Initialize API keys
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface DocumentRow {
  chinese_text: string;
  english_text: string;
}

// Function to chunk text by paragraphs (max 5 paragraphs or ~5000 chars, always breaks at paragraph boundary)
const chunkByParagraphs = (text: string): string[] => {
  // Normalize line endings and split on lines that contain only whitespace or are empty
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
  const chunks: string[] = [];
  const PARAGRAPHS_PER_CHUNK = 5;
  const MAX_CHARS_PER_CHUNK = 5000;

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const para of paragraphs) {
    const paraLength = para.length + 2; // +2 for \n\n separator

    // If adding this paragraph would exceed limits, start new chunk
    if ((currentChunk.length >= PARAGRAPHS_PER_CHUNK || currentLength + paraLength > MAX_CHARS_PER_CHUNK) && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(para);
    currentLength += paraLength;
  }

  // Push remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
};

// Function to generate embedding using Gemini API
const generateEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: `models/${GEMINI_MODEL}`,
      content: {
        parts: [{
          text: text,
        }],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.embedding.values;
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

  const { query, mode = 'balanced' } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing required parameter: query.' });
  }

  try {
    console.log('Starting translation process...');

    // 1. Chunk the input by paragraphs (groups of 5)
    const inputChunks = chunkByParagraphs(query);
    console.log(`Input split into ${inputChunks.length} chunks of ${CHUNK_SIZE} paragraphs each.`);

    if (inputChunks.length === 0) {
      return res.status(400).json({ error: 'No valid text to translate.' });
    }

    // 2. Process each chunk with context window
    const translations: string[] = [];
    const contextWindow: string[] = [];
    const blockedChunks: number[] = [];

    for (let i = 0; i < inputChunks.length; i++) {
      const chunk = inputChunks[i];
      console.log(`Processing chunk ${i + 1}/${inputChunks.length}...`);

      // Generate embedding for this chunk using Hugging Face
      const vector = await generateEmbedding(chunk);

      // Retrieve corpus context
      const corpusContext = await getContext(vector, mode);

      // Get recent translation context (sliding window)
      const recentContext = contextWindow.slice(-CONTEXT_WINDOW_SIZE).join('\n\n');

      // Construct prompt
      const prompt = PROMPT_TEMPLATE
        .replace('{recent_context}', recentContext || 'None (first chunk)')
        .replace('{corpus_context}', corpusContext)
        .replace('{current_text}', chunk);

      // Call Gemini API using Interactions API
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash',
          input: prompt,
        }),
      });

      if (!geminiRes.ok) {
        const errorBody = await geminiRes.text();
        console.error(`[Gemini] API Error for chunk ${i + 1}: ${geminiRes.status}`, errorBody);
        let errorCode = '';
        try { errorCode = JSON.parse(errorBody)?.error?.code ?? ''; } catch {}
        if (geminiRes.status === 400 && BLOCKED_CODES.has(errorCode)) {
          console.warn(`Chunk ${i + 1} blocked by Gemini (${errorCode}); inserting placeholder and continuing.`);
          translations.push(`[Chunk ${i + 1} not translated: blocked by Gemini content policy (${errorCode})]`);
          blockedChunks.push(i + 1);
          continue;
        }
        throw new Error(`Gemini API request failed for chunk ${i + 1} with status ${geminiRes.status}`);
      }

      const geminiData = await geminiRes.json();
      // Interactions API returns steps array with model_output containing content
      const modelOutput = geminiData.steps?.find((step: any) => step.type === 'model_output');
      const translation = modelOutput?.content?.[0]?.text?.trim() || '';

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

    return res.status(200).json({ translation: finalTranslation, blockedChunks });

  } catch (error) {
    console.error('An error occurred in the translation process:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to process translation.', details: errorMessage });
  }
};
