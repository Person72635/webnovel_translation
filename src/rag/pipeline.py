import os
from rag_retriever import RAGRetriever
from prompt_manager import PromptManager
from gemini_translator import GeminiTranslator

def run_rag_translation(query_text: str, mode: str, api_key: str, retriever: RAGRetriever, prompt_manager: PromptManager):
    """Runs the full RAG translation pipeline using pre-initialized components."""
    try:
        # Pass the API key directly
        translator = GeminiTranslator(api_key=api_key)
    except ValueError as e:
        print(f"\n[ERROR] {e}")
        return f"Error: {e}"

    # 2. Get context from the vector database
    context = retriever.get_context_for_text(query_text, mode=mode)

    # 3. Create a prompt for the LLM
    prompt = prompt_manager.create_prompt(query_text, context, mode=mode)
    
    # 4. Call the LLM
    translation = translator.translate(prompt)
    
    return translation
