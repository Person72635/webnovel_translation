# Web Translation Tool

This is a versatile web-based translation tool built with React, TypeScript, and Vite. It supports multiple translation engines, including MyMemory, DeepL, and Google Gemini, and features a specialized translation mode for stylized, example-based translations.

## Features

- **Multiple Translation Engines**: Seamlessly switch between MyMemory, DeepL, and Google Gemini.
- **File Upload**: Translate content directly from `.txt` and `.docx` files.
- **Translation History**: Keeps a record of your last 10 translations, which can be reloaded or downloaded.
- **"If Her Flag Breaks" Mode**: A special translation section that uses one-shot prompting with user-provided examples to produce translations in a specific style. This is ideal for tasks requiring nuanced or stylized output.
- **API Key Management**: Securely enter and use your API keys for DeepL and Gemini.
- **Modern UI**: A clean and responsive user interface built with Tailwind CSS and Lucide icons.

## Project Structure

```
project-root/
├── public/                 # Static assets
│   └── assets/             # Example files for stylized translation
├── src/
│   ├── components/         # Reusable React components (FileUpload, LanguageSelector, etc.)
│   ├── hooks/              # Custom React hooks (useTranslation)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions (fileUtils)
│   ├── App.tsx             # Main application component
│   └── main.tsx            # React entry point
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd project-bolt-sb1-qgdwuszs
    ```
3.  **Install the dependencies:**
    ```bash
    npm install
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to `http://localhost:5173` (or the URL provided by Vite).

### API Keys

To use the DeepL or Google Gemini translation engines, you will need to provide your own API keys.

-   **DeepL**: You can get a free API key from the [DeepL website](https://www.deepl.com/pro-api).
-   **Google Gemini**: You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Enter the keys in the designated input fields in the application's UI.
