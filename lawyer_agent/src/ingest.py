"""
Document ingestion pipeline.
Drop legal PDFs, text files, or Word docs into data/legal_docs/
then run: python -m scripts.ingest
"""

import sys
from pathlib import Path

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
    Docx2txtLoader,
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from .config import load_config, resolve_path


LOADERS = {
    ".pdf": PyPDFLoader,
    ".txt": TextLoader,
    ".md": UnstructuredMarkdownLoader,
    ".docx": Docx2txtLoader,
}


def load_documents(docs_path: Path) -> list:
    documents = []
    supported = LOADERS.keys()
    files = [f for f in docs_path.rglob("*") if f.suffix.lower() in supported]

    if not files:
        print(f"No documents found in {docs_path}")
        return documents

    for filepath in files:
        loader_cls = LOADERS[filepath.suffix.lower()]
        try:
            loader = loader_cls(str(filepath))
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_file"] = filepath.name
                doc.metadata["jurisdiction"] = load_config()["agent"]["jurisdiction"]
            documents.extend(docs)
            print(f"  Loaded: {filepath.name} ({len(docs)} chunks)")
        except Exception as e:
            print(f"  Failed to load {filepath.name}: {e}")

    return documents


def split_documents(documents: list, chunk_size: int, chunk_overlap: int) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
    )
    return splitter.split_documents(documents)


def build_vector_store(chunks: list, embeddings, store_path: Path, collection: str):
    store_path.mkdir(parents=True, exist_ok=True)
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(store_path),
        collection_name=collection,
    )
    vectordb.persist()
    return vectordb


def ingest(reset: bool = False):
    config = load_config()

    docs_path = resolve_path(config["legal_docs"]["path"])
    store_path = resolve_path(config["vector_store"]["path"])

    if reset and store_path.exists():
        import shutil
        shutil.rmtree(store_path)
        print("Cleared existing vector store.")

    print(f"\nLoading documents from: {docs_path}")
    documents = load_documents(docs_path)

    if not documents:
        print("No documents to ingest. Add legal files to data/legal_docs/ and retry.")
        sys.exit(1)

    print(f"\nSplitting {len(documents)} documents...")
    chunks = split_documents(
        documents,
        chunk_size=config["vector_store"]["chunk_size"],
        chunk_overlap=config["vector_store"]["chunk_overlap"],
    )
    print(f"Created {len(chunks)} chunks.")

    print("\nBuilding embeddings (this runs fully offline)...")
    embeddings = HuggingFaceEmbeddings(
        model_name=config["embeddings"]["model"],
        model_kwargs={"device": config["embeddings"]["device"]},
    )

    print("Storing in vector database...")
    build_vector_store(
        chunks,
        embeddings,
        store_path,
        config["vector_store"]["collection_name"],
    )

    print(f"\nIngestion complete. {len(chunks)} chunks indexed.")
