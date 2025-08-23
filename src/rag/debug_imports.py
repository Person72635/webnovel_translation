print("--- Starting import test ---")

try:
    import os
    import json
    print("Successfully imported os, json")

    import tqdm
    print("Successfully imported tqdm")

    import torch
    print("Successfully imported torch")

    import chromadb
    print("Successfully imported chromadb")

    from sentence_transformers import SentenceTransformer
    print("Successfully imported SentenceTransformer")

    print("\n--- All imports successful ---")

except Exception as e:
    print(f"\n--- An error occurred ---")
    print(e)
