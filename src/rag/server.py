from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import run_rag_translation

app = FastAPI()

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
        translation = run_rag_translation(request.query, request.mode, request.api_key)
        return {"translation": translation}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
