import os
import google.generativeai as genai

class GeminiTranslator:
    """Handles translation requests using the Google Gemini API."""
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key not provided. Please provide it in the UI or set the GEMINI_API_KEY environment variable.")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        print("[SUCCESS] Gemini Translator initialized.")

    def translate(self, prompt):
        """Sends a prompt to the Gemini API and returns the translation."""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"[ERROR] An error occurred during Gemini API call: {e}")
            return None
