"""
Run this script to ingest legal documents into the vector store.

Usage:
    python -m scripts.ingest           # Add new docs to existing store
    python -m scripts.ingest --reset   # Wipe and rebuild the store
"""

import sys
import argparse

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from src.ingest import ingest

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest legal documents")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear the existing vector store before ingesting",
    )
    args = parser.parse_args()
    ingest(reset=args.reset)
