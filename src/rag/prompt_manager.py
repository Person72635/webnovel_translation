import json

class PromptManager:
    """Manages the creation of prompts for the Gemini API based on translation mode."""

    def _format_context_for_prompt(self, context):
        """Formats the retrieved context into a string for the prompt."""
        if not context:
            return "No relevant context found."
        
        formatted_context = "\n".join(
            f"- Chinese: {item['chinese_text']}\n  English: {item['english_text']}"
            for item in context
        )
        return formatted_context

    def create_prompt(self, query_text, context, mode='balanced'):
        """Creates a prompt for the specified translation mode."""
        if mode == 'cost_saver':
            return self._create_cost_saver_prompt(query_text, context)
        elif mode == 'balanced':
            return self._create_balanced_prompt(query_text, context)
        elif mode == 'quality':
            return self._create_quality_prompt(query_text, context)
        else:
            raise ValueError(f"Unknown mode: {mode}")

    def _create_cost_saver_prompt(self, query_text, context):
        """Creates a prompt for the 'cost_saver' mode."""
        formatted_context = self._format_context_for_prompt(context)
        prompt = f"""**Translate the following Chinese text to English.**

**Instructions:**
- Use the provided context to ensure consistency with character names, locations, and key terms.
- Produce a natural-sounding English translation.

**Context from the novel:**
{formatted_context}

**Chinese text to translate:**
{query_text}

**English Translation:**
"""
        return prompt

    def _create_balanced_prompt(self, query_text, context):
        """Creates a prompt for the 'balanced' mode. For now, same as cost_saver."""
        return self._create_cost_saver_prompt(query_text, context)

    def _create_quality_prompt(self, query_text, context):
        """Creates a prompt for the 'quality' mode. For now, same as cost_saver."""
        return self._create_cost_saver_prompt(query_text, context)

# --- Example Usage ---
if __name__ == '__main__':
    pm = PromptManager()
    sample_context = [
        {'chinese_text': '旗谷学园', 'english_text': 'Hatagaya Academy'},
        {'chinese_text': '菜波・K・ブレードフィールド', 'english_text': 'Nanami K. Bladefield'}
    ]
    sample_query = "菜波・K・ブレードフィールドは旗谷学园の生徒です。"

    print("--- 'Balanced' Mode Prompt ---")
    balanced_prompt = pm.create_prompt(sample_query, sample_context, mode='balanced')
    print(balanced_prompt)
