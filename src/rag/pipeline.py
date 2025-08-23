import os
from rag_retriever import RAGRetriever
from prompt_manager import PromptManager
from gemini_translator import GeminiTranslator

def run_rag_translation(query_text: str, mode: str, api_key: str):
    """Runs the full RAG translation pipeline."""
    print(f"--- Running RAG pipeline for mode: {mode} ---")

    # 1. Initialize retrievers and managers
    print("[DEBUG] Initializing RAGRetriever...")
    retriever = RAGRetriever()
    print("[DEBUG] RAGRetriever initialized.")

    print("[DEBUG] Initializing PromptManager...")
    prompt_manager = PromptManager()
    print("[DEBUG] PromptManager initialized.")

    print("[DEBUG] Initializing GeminiTranslator...")
    try:
        # Pass the API key directly
        translator = GeminiTranslator(api_key=api_key)
    except ValueError as e:
        print(f"\n[ERROR] {e}")
        return f"Error: {e}"

    # 2. Get context from the vector database
    print("\nStep 1: Retrieving context...")
    context = retriever.get_context_for_text(query_text, mode=mode)
    print(f"Retrieved {len(context)} context pairs.")

    # 3. Create a prompt for the LLM
    print("\nStep 2: Creating prompt...")
    prompt = prompt_manager.create_prompt(query_text, context, mode=mode)
    
    # 4. Call the LLM
    print("\nStep 3: Calling Gemini API...")
    translation = translator.translate(prompt)
    
    print("\n--- FINAL TRANSLATION ---")
    print(translation)
    return translation
