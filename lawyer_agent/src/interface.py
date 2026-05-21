"""
Interactive CLI interface for the offline lawyer agent.
"""

import sys

from .agent import LawyerAgent
from .config import load_config


BANNER = """
╔══════════════════════════════════════════════════════╗
║           LexAI — Offline Legal Assistant            ║
║   Jurisdiction: {jurisdiction:<36}║
║   Legal System: {legal_system:<36}║
║   Language:     {language:<36}║
╚══════════════════════════════════════════════════════╝

Commands:
  /case    — Analyze a legal case or fact pattern
  /draft   — Draft a legal document
  /explain — Explain a legal concept in plain language
  /quit    — Exit

Just type your question or use a command.
"""

MODE_PROMPTS = {
    "/case": "Describe the case facts and legal issue",
    "/draft": "Enter: <document type> | <facts>  (e.g. 'demand letter | tenant owes 3 months rent')",
    "/explain": "Enter the legal concept to explain",
}


def print_result(result: dict):
    print("\n" + "=" * 60)
    print(result["answer"])
    if result.get("sources"):
        print("\n--- Sources Referenced ---")
        for src in result["sources"]:
            print(f"  • {src}")
    print("=" * 60 + "\n")


def run_cli():
    config = load_config()
    agent_cfg = config["agent"]

    print(BANNER.format(
        jurisdiction=agent_cfg["jurisdiction"],
        legal_system=agent_cfg["legal_system"].replace("_", " ").title(),
        language=agent_cfg["language"],
    ))

    print("Initializing agent (loading embeddings)...")
    try:
        agent = LawyerAgent()
        # Warm up retriever
        agent._get_retriever()
        print("Agent ready.\n")
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        sys.exit(1)

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye.")
            break

        if not user_input:
            continue

        if user_input.lower() in ("/quit", "/exit", "quit", "exit"):
            print("Goodbye.")
            break

        try:
            if user_input.startswith("/draft"):
                remainder = user_input[6:].strip()
                if not remainder:
                    remainder = input(f"{MODE_PROMPTS['/draft']}: ").strip()
                if "|" in remainder:
                    doc_type, facts = remainder.split("|", 1)
                else:
                    doc_type = remainder
                    facts = input("Facts: ").strip()
                result_text = agent.draft_document(doc_type.strip(), facts.strip())
                print_result({"answer": result_text, "sources": []})

            elif user_input.startswith("/explain"):
                concept = user_input[8:].strip()
                if not concept:
                    concept = input(f"{MODE_PROMPTS['/explain']}: ").strip()
                result_text = agent.explain_law(concept)
                print_result({"answer": result_text, "sources": []})

            elif user_input.startswith("/case"):
                query = user_input[5:].strip()
                if not query:
                    query = input(f"{MODE_PROMPTS['/case']}: ").strip()
                result = agent.analyze_case(query)
                print_result(result)

            else:
                # Default: treat as a general legal query
                result = agent.analyze_case(user_input)
                print_result(result)

        except Exception as e:
            print(f"\nError during processing: {e}\n")
