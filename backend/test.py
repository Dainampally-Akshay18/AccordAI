# Minimal working requirements.txt
fastapi
uvicorn[standard]
python-multipart
pydantic
pydantic-settings
sqlalchemy
asyncpg
alembic
firebase-admin
langchain
groq
pinecone-client
python-dotenv
aiofiles
httpx
PyMuPDF
python-docx
Pillow
deep-translator


# Core FastAPI dependencies
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# FAISS and ML dependencies - Render compatible versions
faiss-cpu==1.7.2  # Specific version for Render compatibility
sentence-transformers==2.2.2
scikit-learn==1.3.0
numpy==1.24.3
torch==2.0.1
transformers==4.30.2

# Other dependencies
requests==2.31.0
python-dotenv==1.0.0
pydantic==2.4.2
