import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# --- Configuration ---
FLAG_CHUNKS_PATH = os.path.join('public', 'assets', 'flag_chunks')
VECTOR_DB_PATH = os.path.join(FLAG_CHUNKS_PATH, 'vector_db')
ENGLISH_CHUNK_MAP_PATH = os.path.join(VECTOR_DB_PATH, 'english_chunks.json')
COLLECTION_NAME = "flag_translation_context"
EMBEDDING_MODEL = 'embaas/sentence-transformers-multilingual-e5-large'

class RAGRetriever:
    def __init__(self):
        print("[DEBUG] Initializing RAG Retriever...")
        print(f"[DEBUG] Loading vector DB from: {VECTOR_DB_PATH}")
        self.client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
        print("[DEBUG] ChromaDB persistent client initialized.")
        print("[DEBUG] Loading SentenceTransformer model... (This may take a while)")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        print("[DEBUG] SentenceTransformer model loaded successfully.")
        self.collection = self.client.get_collection(name=COLLECTION_NAME)
        self.english_chunk_map = self._load_english_chunk_map()
        print("[DEBUG] ChromaDB client and model loaded.")
        self.collection = self.client.get_collection(name=COLLECTION_NAME)
        print(f"[DEBUG] Successfully got collection '{COLLECTION_NAME}' with {self.collection.count()} items.")
        self.english_chunk_map = self._load_english_chunk_map()
        print("[DEBUG] English chunk map loaded.")
        print("[SUCCESS] RAG Retriever initialized successfully.")

    def _load_english_chunk_map(self):
        """Loads the mapping from chunk ID to English text."""
        if not os.path.exists(ENGLISH_CHUNK_MAP_PATH):
            raise FileNotFoundError(f"English chunk map not found at {ENGLISH_CHUNK_MAP_PATH}")
        with open(ENGLISH_CHUNK_MAP_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _query_collection(self, query_texts, n_results=3):
        """Embeds query texts and searches the ChromaDB collection."""
        query_embeddings = self.model.encode(query_texts)
        results = self.collection.query(
            query_embeddings=query_embeddings.tolist(),
            n_results=n_results
        )
        return results

    def _format_context(self, ids):
        """Formats retrieved IDs into a list of Chinese/English text pairs."""
        if not ids:
            return []

        # Fetch the documents (Chinese text) from ChromaDB using the retrieved IDs
        retrieved_docs = self.collection.get(ids=ids, include=["documents"])
        
        # Create a dictionary to map ID to Chinese text for easier lookup
        id_to_chinese_text = {id: text for id, text in zip(retrieved_docs['ids'], retrieved_docs['documents'])}

        context = []
        # Ensure the order of context matches the order of the retrieved IDs
        for doc_id in ids:
            if doc_id in self.english_chunk_map and doc_id in id_to_chinese_text:
                context.append({
                    "chinese_text": id_to_chinese_text[doc_id],
                    "english_text": self.english_chunk_map[doc_id]
                })
        return context

    def get_context_for_text(self, query_text, mode='balanced', n_sections=5):
        """Main method to retrieve context based on the selected mode."""
        if mode == 'cost_saver':
            # For cost saver, we find the best overall context for the whole text
            results = self._query_collection([query_text], n_results=3)
            unique_ids = list(dict.fromkeys(results['ids'][0]))
            return self._format_context(unique_ids)

        elif mode == 'balanced':
            # Find global context based on the whole text
            results = self._query_collection([query_text], n_results=3)
            global_context_ids = list(dict.fromkeys(results['ids'][0]))
            return self._format_context(global_context_ids)

        elif mode == 'quality':
            # 1. Get global context (same as balanced)
            global_results = self._query_collection([query_text], n_results=2) # Get 2 best global examples
            global_ids = list(dict.fromkeys(global_results['ids'][0]))

            # 2. Get specific context for the current section (this is a placeholder)
            # In a real scenario, this function would be called for each section of the text.
            specific_results = self._query_collection([query_text], n_results=1) # Get 1 best specific example
            specific_ids = list(dict.fromkeys(specific_results['ids'][0]))
            
            # Combine and ensure uniqueness, prioritizing specific context
            combined_ids = list(dict.fromkeys(specific_ids + global_ids))[:3]
            return self._format_context(combined_ids)

        else:
            raise ValueError(f"Unknown mode: {mode}")

# --- Example Usage (for demonstration) ---
if __name__ == '__main__':
    print("\n--- SCRIPT EXECUTION STARTED ---")
    retriever = RAGRetriever()
    
    # Simulate a query from the user
    sample_query = "私立旗谷学园。坐拥广大校地，放眼就是紧邻新宿都心及明治神宫的代代木公园，实施从幼稚园到大学的一贯制，规模庞大。"

    print("\n--- Testing 'cost_saver' mode ---")
    cost_saver_context = retriever.get_context_for_text(sample_query, mode='cost_saver')
    print(json.dumps(cost_saver_context, indent=2, ensure_ascii=False))

    print("\n--- Testing 'balanced' mode ---")
    balanced_context = retriever.get_context_for_text(sample_query, mode='balanced')
    print(json.dumps(balanced_context, indent=2, ensure_ascii=False))

    print("\n--- Testing 'quality' mode ---")
    quality_context = retriever.get_context_for_text(sample_query, mode='quality')
    print(json.dumps(quality_context, indent=2, ensure_ascii=False))
