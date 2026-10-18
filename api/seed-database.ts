import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pipeline } from '@xenova/transformers';
import { Pool } from 'pg';
import path from 'path';
import * as fs from 'fs/promises';

// --- Configuration ---
const FLAG_CHUNKS_PATH = path.join(process.cwd(), 'public', 'assets', 'flag_chunks');
const EMBEDDING_MODEL = 'Xenova/multilingual-e5-large';
const CHUNK_SIZE = 5; // Number of paragraphs per database chunk

// Initialize DB connection
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const getPairedFiles = async (chunkDir: string): Promise<[string | null, string | null]> => {
  let chineseFile: string | null = null;
  let englishFile: string | null = null;
  const files = await fs.readdir(chunkDir);
  for (const filename of files) {
    if (filename.includes('Chinese.txt')) {
      chineseFile = path.join(chunkDir, filename);
    } else if (filename.includes('English.txt')) {
      englishFile = path.join(chunkDir, filename);
    }
  }
  return [chineseFile, englishFile];
};

const createAlignedChunks = async (chinesePath: string, englishPath: string, flagName: string, bookNumber: number) => {
  const chineseText = await fs.readFile(chinesePath, 'utf-8');
  const englishText = await fs.readFile(englishPath, 'utf-8');

  const chineseParas = chineseText.split('\n\n').map((p: string) => p.trim()).filter((p: string) => p);
  const englishParas = englishText.split('\n\n').map((p: string) => p.trim()).filter((p: string) => p);

  if (chineseParas.length !== englishParas.length) {
    console.warn(`[WARNING] Mismatch in paragraph count for Book ${bookNumber}, Flag ${flagName}`);
  }

  const alignedChunks: { id: string; source_chinese_text: string; target_english_text: string; }[] = [];
  const numParas = Math.min(chineseParas.length, englishParas.length);

  for (let i = 0; i < numParas; i += CHUNK_SIZE) {
    const chunkIndex = Math.floor(i / CHUNK_SIZE);
    const chunkId = `book_${bookNumber}_${flagName}_chunk_${chunkIndex}`;
    const chineseSegment = chineseParas.slice(i, i + CHUNK_SIZE).join('\n\n');
    const englishSegment = englishParas.slice(i, i + CHUNK_SIZE).join('\n\n');
    alignedChunks.push({
      id: chunkId,
      source_chinese_text: chineseSegment,
      target_english_text: englishSegment,
    });
  }
  return alignedChunks;
};

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Simple auth check (you can add a real secret key)
  const { secret } = req.body;
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting database seeding...');

    const client = await pool.connect();

    try {
      // Create pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('pgvector extension is enabled.');

      // Create table
      await client.query(`
        CREATE TABLE IF NOT EXISTS gaworare (
          id TEXT PRIMARY KEY,
          chinese_text TEXT,
          english_text TEXT,
          embedding VECTOR(1024)
        )
      `);
      console.log('Table `gaworare` is ready.');

      // Clear existing documents to avoid duplicates
      await client.query('DELETE FROM gaworare');
      console.log('Cleared existing documents from the table.');

      const allAlignedChunks: { id: string; source_chinese_text: string; target_english_text: string; }[] = [];
      const flagDirs = (await fs.readdir(FLAG_CHUNKS_PATH))
        .filter((name: string) => name.startsWith('flag_'))
        .sort();

      console.log(`Found ${flagDirs.length} flag directories.`);

      for (const flagDirName of flagDirs) {
        const chunkDirPath = path.join(FLAG_CHUNKS_PATH, flagDirName);
        const [chineseFile, englishFile] = await getPairedFiles(chunkDirPath);

        if (chineseFile && englishFile) {
          console.log(`Processing ${flagDirName}...`);
          const aligned = await createAlignedChunks(chineseFile, englishFile, flagDirName, 1);
          allAlignedChunks.push(...aligned);
        } else {
          console.log(`Skipping ${flagDirName} (missing paired files)`);
        }
      }

      console.log(`Generated a total of ${allAlignedChunks.length} aligned text chunks.`);

      if (allAlignedChunks.length === 0) {
        return res.status(400).json({ error: 'No chunks to process.' });
      }

      console.log('Loading embedding model... (This may take a while)');
      const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL, { quantized: true });
      console.log('Embedding model loaded.');

      console.log('Generating and inserting embeddings...');
      for (const chunk of allAlignedChunks) {
        const embedding = await extractor(chunk.source_chinese_text, { pooling: 'mean', normalize: true });
        const vector = Array.from(embedding.data);

        await client.query(
          'INSERT INTO gaworare (id, chinese_text, english_text, embedding) VALUES ($1, $2, $3, $4)',
          [chunk.id, chunk.source_chinese_text, chunk.target_english_text, `[${vector.join(',')}]`]
        );
        console.log(`Inserted chunk ${chunk.id}`);
      }

      console.log('\nDatabase seeding complete!');
      const { rows } = await client.query('SELECT COUNT(*) FROM gaworare');
      console.log(`Total items in collection: ${rows[0].count}`);

      return res.status(200).json({
        success: true,
        message: 'Database seeded successfully',
        totalChunks: allAlignedChunks.length,
        totalItems: rows[0].count
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('An error occurred during seeding:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to seed database.', details: errorMessage });
  }
};
