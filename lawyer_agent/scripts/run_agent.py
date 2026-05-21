"""
Start the interactive lawyer agent CLI.

Usage:
    python -m scripts.run_agent
"""

import sys

sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))

from src.interface import run_cli

if __name__ == "__main__":
    run_cli()
