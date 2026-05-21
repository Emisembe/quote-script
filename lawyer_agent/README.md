# LexAI — Offline Lawyer Agent

A fully offline AI legal assistant. Runs on your machine with no internet required after setup. Supports any country and language by updating the legal documents and configuration.

## How It Works

```
Your Legal Docs (PDF/TXT/DOCX)
        ↓
   [Ingestion]  →  Vector Store (ChromaDB)
                         ↓
User Query  →  [Retriever]  →  Relevant Law Excerpts
                         ↓
              [Local LLM (Ollama)]  →  Legal Analysis
```

## Quick Start

### 1. Install Ollama (the offline LLM runner)

```bash
# Linux / Mac
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (choose one):
ollama pull llama3          # English, best quality
ollama pull mistral         # English, fast
ollama pull aya             # Multilingual (23 languages)
ollama pull gemma2          # Lightweight option
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure for your country

Edit `config/settings.yaml`:

```yaml
agent:
  jurisdiction: "Kenya"        # Your country
  legal_system: "common_law"   # common_law | civil_law | mixed
  language: "en"               # Language code

llm:
  model: "llama3"              # Must match what you pulled in step 1
```

### 4. Add legal documents

Drop PDF, TXT, or DOCX files into `data/legal_docs/`.

See `data/legal_docs/README.txt` for sources and guidance.

### 5. Ingest documents

```bash
cd lawyer_agent
python -m scripts.ingest
```

Add `--reset` to rebuild from scratch:
```bash
python -m scripts.ingest --reset
```

### 6. Run the agent

```bash
python -m scripts.run_agent
```

## Usage Examples

```
You: What are the elements of a valid contract in Kenya?

You: /case My employer terminated me without notice after 5 years of service. I have a written contract. What are my rights?

You: /draft demand letter | Landlord has not returned security deposit of KES 50,000 after 3 months of vacating the premises.

You: /explain Beyond reasonable doubt
```

## Switching Countries

1. Update `config/settings.yaml` with the new jurisdiction and language
2. Replace documents in `data/legal_docs/` with that country's laws
3. Re-ingest: `python -m scripts.ingest --reset`

## Multilingual Support

For non-English jurisdictions, use the `aya` model which supports 23 languages including Swahili, Arabic, French, Portuguese, Spanish, and more.

```yaml
llm:
  model: "aya"
agent:
  language: "sw"   # Swahili
```

## Project Structure

```
lawyer_agent/
├── config/
│   ├── settings.yaml        # All configuration here
│   └── system_prompt.txt    # Agent's legal reasoning instructions
├── data/
│   ├── legal_docs/          # Drop your legal documents here
│   └── vector_store/        # Auto-generated after ingestion
├── src/
│   ├── config.py            # Config loader
│   ├── ingest.py            # Document ingestion & vectorization
│   ├── retriever.py         # RAG retrieval
│   ├── agent.py             # Core agent logic
│   └── interface.py         # CLI interface
├── scripts/
│   ├── ingest.py            # Run to index documents
│   └── run_agent.py         # Run to start agent
└── requirements.txt
```

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Storage | 10 GB | 20 GB |
| CPU | 4 cores | 8 cores |
| GPU | Not required | Speeds up LLM 10x |
