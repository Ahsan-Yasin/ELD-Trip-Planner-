import os
import requests
import json
import chromadb
from sentence_transformers import SentenceTransformer

# Load OpenRouter API Key
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# Setup ChromaDB paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHROMA_DB_PATH = os.path.join(BASE_DIR, 'chroma_db')

# Lazy loaded components
_chroma_client = None
_fmcsa_collection = None
_embedding_model = None

def get_chroma_collection():
    global _chroma_client, _fmcsa_collection
    if _chroma_client is None:
        try:
            _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
            _fmcsa_collection = _chroma_client.get_collection("fmcsa_rules")
        except Exception as e:
            print(f"Warning: Could not connect to ChromaDB: {e}")
    return _fmcsa_collection

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _embedding_model


def retrieve_relevant_context(query: str, top_k=3) -> str:
    """
    Embeds the user query and searches ChromaDB for the closest FMCSA PDF chunks.
    """
    collection = get_chroma_collection()
    if not collection:
        return "No FMCSA documentation available in database."

    model = get_embedding_model()
    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )

    if not results['documents'] or not results['documents'][0]:
        return "No relevant FMCSA documentation found."

    context_str = "\n\n---\n\n".join(results['documents'][0])
    return context_str


def answer_compliance_question(message: str, conversation_history: list = None, trip_context: dict = None) -> str:
    """
    1. Retrieves relevant FMCSA chunks from ChromaDB.
    2. Constructs a highly strict system prompt minimizing token usage.
    3. Calls OpenRouter LLM.
    """
    if not OPENROUTER_API_KEY:
        return "OpenRouter API Key not configured. Please add OPENROUTER_API_KEY to your .env file."

    # Retrieve context from ChromaDB
    retrieved_text = retrieve_relevant_context(message)

    # Format trip data if provided
    trip_str = ""
    if trip_context:
        trip_str = f"""
Current Trip Profile:
- Route: {trip_context.get('from')} to {trip_context.get('to')}
- Distance: {trip_context.get('distance_mi')} miles
- Est. Drive Time: {trip_context.get('duration_hr')} hours
- Current Compliance Status: {'Compliant' if trip_context.get('is_compliant') else 'Warning'}
"""

    system_prompt = f"""You are LogisticsPro AI, a highly professional ELD & FMCSA compliance expert.

CRITICAL INSTRUCTIONS:
1. Provide SHORT, CONCISE, and DIRECT answers to save tokens.
2. Only provide long explanations if the user explicitly asks for "details", "explanation", or "why".
3. Use bullet points for readability if listing rules.
4. Base your answers strictly on the FMCSA Documentation below. Do not guess.

FMCSA DOCUMENTATION CONTEXT:
{retrieved_text}
{trip_str}
"""

    # Build messages payload
    messages = [{"role": "system", "content": system_prompt}]
    
    if conversation_history:
        for msg in conversation_history[-5:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            
    messages.append({"role": "user", "content": message})

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "LogisticsPro",
            },
            json={
                "model": "google/gemini-2.5-flash",
                "messages": messages,
                "temperature": 0.2, # Low temp for factual answers
                "max_tokens": 300   # Limit output tokens to ensure brevity
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        return "I'm having trouble connecting to my AI brain right now. Please try again later."
