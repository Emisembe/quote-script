"""
RAG retriever — loads the vector store and retrieves relevant legal context.
"""

from pathlib import Path

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from .config import load_config, resolve_path


def load_retriever():
    config = load_config()
    store_path = resolve_path(config["vector_store"]["path"])

    if not store_path.exists():
        raise FileNotFoundError(
            "Vector store not found. Run `python -m scripts.ingest` first."
        )

    embeddings = HuggingFaceEmbeddings(
        model_name=config["embeddings"]["model"],
        model_kwargs={"device": config["embeddings"]["device"]},
    )

    vectordb = Chroma(
        persist_directory=str(store_path),
        embedding_function=embeddings,
        collection_name=config["vector_store"]["collection_name"],
    )

    retriever = vectordb.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={
            "k": config["retrieval"]["top_k"],
            "score_threshold": config["retrieval"]["score_threshold"],
        },
    )

    return retriever


def format_context(docs: list) -> str:
    if not docs:
        return "No relevant legal documents found in the knowledge base."

    sections = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source_file", "Unknown")
        page = doc.metadata.get("page", "")
        page_ref = f", page {page}" if page else ""
        sections.append(
            f"[Source {i}: {source}{page_ref}]\n{doc.page_content.strip()}"
        )

    return "\n\n---\n\n".join(sections)
