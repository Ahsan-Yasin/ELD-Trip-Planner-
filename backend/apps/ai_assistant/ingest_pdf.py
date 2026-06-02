import os
import chromadb
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF_PATH = os.path.join(BASE_DIR, '..', 'fmcsa-hos-395-drivers-guide-to-hos-2022-04-28-0-1- (1).pdf')
CHROMA_DB_PATH = os.path.join(BASE_DIR, 'chroma_db')

def extract_text_from_pdf(pdf_path):
    print(f"Reading PDF: {pdf_path}")
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def ingest():
    print("🚀 Starting ChromaDB Ingestion Pipeline...")
    
    if not os.path.exists(PDF_PATH):
        print(f"❌ Error: PDF not found at {PDF_PATH}")
        return

    # 1. Extract and Chunk Text
    text = extract_text_from_pdf(PDF_PATH)
    chunks = chunk_text(text, chunk_size=300, overlap=50)
    print(f"✅ Generated {len(chunks)} chunks from the PDF.")

    # 2. Load Embedding Model
    print("⏳ Loading sentence-transformer model (this may take a minute)...")
    # Using a fast, small model for embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2') 
    
    # 3. Embed chunks
    print("⏳ Generating embeddings...")
    embeddings = model.encode(chunks).tolist()
    
    # 4. Setup ChromaDB
    print(f"💾 Saving to persistent ChromaDB at {CHROMA_DB_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    # Delete collection if it exists to start fresh
    try:
        client.delete_collection("fmcsa_rules")
    except:
        pass
        
    collection = client.create_collection(
        name="fmcsa_rules",
        metadata={"hnsw:space": "cosine"} # cosine similarity is good for text search
    )
    
    # 5. Insert data
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": "fmcsa_guide", "chunk_index": i} for i in range(len(chunks))]
    
    collection.add(
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )
    
    print("✅ Ingestion complete! The database is ready for the RAG engine.")

if __name__ == "__main__":
    ingest()
