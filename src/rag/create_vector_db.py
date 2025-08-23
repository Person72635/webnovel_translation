import os
import json
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# --- Configuration ---
FLAG_CHUNKS_PATH = os.path.join('public', 'assets', 'flag_chunks')
VECTOR_DB_PATH = os.path.join(FLAG_CHUNKS_PATH, 'vector_db')
ENGLISH_CHUNK_MAP_PATH = os.path.join(VECTOR_DB_PATH, 'english_chunks.json')
COLLECTION_NAME = "flag_translation_context"
EMBEDDING_MODEL = 'embaas/sentence-transformers-multilingual-e5-large'


def get_paired_files(chunk_dir):
    """Finds the paired Chinese and English files in a chunk directory."""
    chinese_file = None
    english_file = None
    for filename in os.listdir(chunk_dir):
        if 'Chinese.txt' in filename:
            chinese_file = os.path.join(chunk_dir, filename)
        elif 'English.txt' in filename:
            english_file = os.path.join(chunk_dir, filename)
    return chinese_file, english_file

def create_aligned_chunks(chinese_path, english_path, flag_number, book_number):
    """Reads paired files and splits them into aligned paragraph chunks."""
    with open(chinese_path, 'r', encoding='utf-8') as f:
        chinese_text = f.read()
    with open(english_path, 'r', encoding='utf-8') as f:
        english_text = f.read()

    chinese_paras = [p.strip() for p in chinese_text.split('\n\n') if p.strip()]
    english_paras = [p.strip() for p in english_text.split('\n\n') if p.strip()]

    if len(chinese_paras) != len(english_paras):
        print(f"[WARNING] Mismatch in paragraph count for Book {book_number}, Flag {flag_number}: "
              f"{os.path.basename(chinese_path)} ({len(chinese_paras)}) vs "
              f"{os.path.basename(english_path)} ({len(english_paras)})")

    aligned_chunks = []
    num_chunks = min(len(chinese_paras), len(english_paras))
    for i in range(num_chunks):
        chunk_id = f"book_{book_number}_flag_{flag_number}_para_{i}"
        aligned_chunks.append({
            "id": chunk_id,
            "source_chinese_text": chinese_paras[i],
            "target_english_text": english_paras[i],
            "metadata": {
                "book_number": book_number,
                "flag_number": flag_number,
                "paragraph_index": i,
                "source_file": os.path.basename(chinese_path)
            }
        })
    return aligned_chunks

def main():
    """Main function to create and populate the vector database."""
    print("Starting RAG vector database creation...")

    if not os.path.exists(VECTOR_DB_PATH):
        os.makedirs(VECTOR_DB_PATH)

    client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    print("[DEBUG] ChromaDB client initialized.")

    print("[DEBUG] Loading SentenceTransformer model... (This may take a while)")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("[DEBUG] SentenceTransformer model loaded successfully.")

    print(f"Initializing ChromaDB collection: '{COLLECTION_NAME}'")
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}  # Using cosine similarity
    )

    all_aligned_chunks = []
    flag_dirs = [d for d in os.listdir(FLAG_CHUNKS_PATH) if os.path.isdir(os.path.join(FLAG_CHUNKS_PATH, d)) and 'flag_chunk_' in d]

    print(f"Found {len(flag_dirs)} flag chunk directories to process.")
    for flag_dir_name in sorted(flag_dirs):
        try:
            flag_number = int(flag_dir_name.split('_')[-1])
            chunk_dir_path = os.path.join(FLAG_CHUNKS_PATH, flag_dir_name)
            chinese_file, english_file = get_paired_files(chunk_dir_path)

            if chinese_file and english_file:
                print(f"Processing Flag {flag_number}...")
                # For now, assume all existing chunks are from Book 1
                book_number = 1
                aligned = create_aligned_chunks(chinese_file, english_file, flag_number, book_number)
                all_aligned_chunks.extend(aligned)
            else:
                print(f"[SKIPPING] Could not find paired files in {flag_dir_name}")
        except (ValueError, IndexError):
            print(f"[SKIPPING] Could not parse flag number from '{flag_dir_name}'")

    print(f"Generated a total of {len(all_aligned_chunks)} aligned text chunks.")

    english_chunk_map = {}
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []

    for chunk in all_aligned_chunks:
        english_chunk_map[chunk['id']] = chunk['target_english_text']
        documents_to_add.append(chunk['source_chinese_text'])
        metadatas_to_add.append(chunk['metadata'])
        ids_to_add.append(chunk['id'])

    print("Generating embeddings for Chinese text chunks... (This may take a while)")
    print(f"[DEBUG] Encoding {len(documents_to_add)} documents...")
    embeddings = model.encode(documents_to_add, show_progress_bar=True)
    print("[DEBUG] Embeddings generated successfully.")

    print("Adding documents to ChromaDB...")
    collection.add(
        embeddings=embeddings.tolist(),
        documents=documents_to_add,
        metadatas=metadatas_to_add,
        ids=ids_to_add
    )

    print(f"Saving English chunk map to {ENGLISH_CHUNK_MAP_PATH}")
    with open(ENGLISH_CHUNK_MAP_PATH, 'w', encoding='utf-8') as f:
        json.dump(english_chunk_map, f, ensure_ascii=False, indent=2)

    print("\nVector database creation complete!")
    print(f"DB stored at: {VECTOR_DB_PATH}")
    print(f"Total items in collection: {collection.count()}")

if __name__ == "__main__":
    main()
