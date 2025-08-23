import os
import json
import argparse
from pipeline import run_rag_translation
from dotenv import load_dotenv
import os

def main(query_text, mode='balanced'):
    """Main function to run the RAG translation pipeline from the command line."""
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("\n[ERROR] GEMINI_API_KEY environment variable not set.")
        print("Please set the environment variable and try again.")
        return

    run_rag_translation(query_text, mode, api_key)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Translate Chinese text using a RAG pipeline.")
    
    default_query = "私立旗谷学园。坐拥广大校地，放眼就是紧邻新宿都心及明治神宫的代代木公园，实施从幼稚园到大学的一贯制，规模庞大。"

    parser.add_argument(
        "--query", 
        type=str, 
        default=default_query,
        help="The Chinese text to translate."
    )
    parser.add_argument(
        "--mode", 
        type=str, 
        default='balanced', 
        choices=['cost_saver', 'balanced', 'quality'],
        help="The translation mode to use (cost_saver, balanced, quality)."
    )

    args = parser.parse_args()
    
    main(args.query, args.mode)
