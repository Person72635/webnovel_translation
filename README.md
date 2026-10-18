# Web Translation Tool

A versatile web-based translation tool supporting multiple translation engines with a specialized RAG-powered mode for stylized translations.

## Features

- **Multiple Translation Engines**: Seamlessly switch between MyMemory, DeepL, and Google Gemini
- **File Upload Support**: Translate content directly from `.txt` and `.docx` files
- **Translation History**: Keeps a record of your last 10 translations for easy access
- **RAG-Powered Stylized Translation**: Advanced translation mode using Retrieval-Augmented Generation (RAG) with vector embeddings for highly accurate, style-consistent translations
- **Selectable RAG Modes**: Choose between `Cost Saver`, `Balanced`, and `Quality` modes to optimize for speed, cost, or accuracy
- **API Key Management**: Securely enter and use your API keys for DeepL and Gemini
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Lucide icons

## How to Use

1. **Enter or Upload Text**: Type your text directly or upload a `.txt` or `.docx` file
2. **Select Languages**: Choose your source and target languages from the dropdown
3. **Choose Translation Engine**: Select MyMemory (free), DeepL, or Google Gemini
4. **Translate**: Click the translate button to get your translation
5. **RAG Mode**: For stylized translations, use the "If Her Flag Breaks" tab to leverage the RAG system
6. **History**: Access your recent translations from the History tab to reload or download them

### Getting API Keys

To use DeepL or Google Gemini translation engines, you'll need your own API keys:

- **DeepL**: Get a free API key from the [DeepL website](https://www.deepl.com/pro-api)
- **Google Gemini**: Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Enter these keys in the application's UI when prompted.

---

## For Developers

### Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with pgvector extension (for RAG)
- **Hosting**: Vercel (serverless functions)
- **AI/ML**: Google Gemini API, Xenova Transformers (local embeddings)

### Project Structure

```
project-root/
├── public/                 # Static assets
│   └── assets/             # Translation corpus files
├── src/
│   ├── components/         # React components (FileUpload, LanguageSelector, etc.)
│   ├── hooks/              # Custom React hooks (useTranslation)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions (fileUtils)
│   ├── api/                # Serverless API functions (translate-rag)
│   ├── scripts/            # Database seeding script (seed-database)
│   ├── App.tsx             # Main application component
│   └── main.tsx            # React entry point
├── .gitignore
├── .env.example           # Environment variable template
├── index.html
├── package.json
├── README.md
└── vite.config.ts
```

### Prerequisites

- Node.js (v18 or later)
- npm
- PostgreSQL database with pgvector extension (for RAG feature)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the project directory:**
   ```bash
   cd project-directory
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your environment variables:
     ```
     POSTGRES_URL="your-database-connection-string"
     ```

### Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

### Setting Up the RAG Database

To use the RAG-powered translation feature, you need to set up a PostgreSQL database with the `pgvector` extension:

1. **Create a PostgreSQL Database:**
   - Use a provider like [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or any host supporting `pgvector`
   - Get your connection string (format: `postgres://user:password@host:port/dbname`)

2. **Configure Environment Variables:**

   **For Local Development:**
   - Add to your `.env` file:
     ```
     POSTGRES_URL="your-database-connection-string"
     ```

   **For Vercel Deployment:**
   - Go to Vercel project → **Settings** → **Environment Variables**
   - Add `POSTGRES_URL` with your connection string
   - Apply to all environments (Production, Preview, Development)
   - Or use Vercel CLI:
     ```bash
     vercel env add POSTGRES_URL
     ```

3. **Seed the Database:**
   ```bash
   npm run db:seed
   ```
   This populates the database with text chunks and their embeddings. It may take a few minutes on the first run as it downloads the embedding model.

### Deployment

The application is deployed on Vercel with serverless functions for the RAG translation API. The `src/api/translate-rag.ts` file handles RAG translation requests.
