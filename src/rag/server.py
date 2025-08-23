from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from contextlib import asynccontextmanager
from rag_retriever import RAGRetriever
from prompt_manager import PromptManager
from pipeline import run_rag_translation

# Global objects to hold the initialized models
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML models
    print("Loading RAGRetriever...")
    ml_models["retriever"] = RAGRetriever()
    print("Loading PromptManager...")
    ml_models["prompt_manager"] = PromptManager()
    print("Models loaded.")
    yield
    # Clean up the ML models and release the resources
    ml_models.clear()

app = FastAPI(lifespan=lifespan)


# Configure CORS to allow requests from your frontend
origins = [
    "http://localhost:5173",  # Default Vite dev server
    "http://127.0.0.1:5173",
    # Add the URL of your deployed frontend if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "RAG Translation Server is running."}


class TranslationRequest(BaseModel):
    query: str
    mode: str
    api_key: str

@app.post("/api/translate-rag")
def translate_rag_endpoint(request: TranslationRequest):
    """API endpoint to run the RAG translation pipeline."""
    try:
        translation = run_rag_translation(
            request.query,
            request.mode,
            request.api_key,
            retriever=ml_models["retriever"],
            prompt_manager=ml_models["prompt_manager"]
        )
        return {"translation": translation}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run(app, host="localhost", port=8000)
