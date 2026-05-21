"""
Core lawyer agent — combines the LLM with RAG retrieval.
"""

from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

from .config import load_config, load_system_prompt
from .retriever import load_retriever, format_context


CASE_TEMPLATE = """{system_prompt}

=== LEGAL KNOWLEDGE BASE CONTEXT ===
{context}
=== END CONTEXT ===

=== CASE / QUERY ===
{question}
=== END CASE ===

Provide a thorough legal analysis based on the context above.
"""


class LawyerAgent:
    def __init__(self):
        self.config = load_config()
        self.system_prompt = load_system_prompt(self.config)
        self._llm = None
        self._retriever = None

    def _get_llm(self):
        if self._llm is None:
            llm_cfg = self.config["llm"]
            self._llm = Ollama(
                model=llm_cfg["model"],
                base_url=llm_cfg["base_url"],
                temperature=llm_cfg["temperature"],
                num_predict=llm_cfg["max_tokens"],
            )
        return self._llm

    def _get_retriever(self):
        if self._retriever is None:
            self._retriever = load_retriever()
        return self._retriever

    def analyze_case(self, query: str) -> dict:
        retriever = self._get_retriever()
        llm = self._get_llm()

        relevant_docs = retriever.get_relevant_documents(query)
        context = format_context(relevant_docs)

        prompt = PromptTemplate(
            input_variables=["context", "question"],
            template=CASE_TEMPLATE.replace("{system_prompt}", self.system_prompt),
        )

        chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True,
        )

        result = chain({"query": query})

        sources = list({
            doc.metadata.get("source_file", "Unknown")
            for doc in result.get("source_documents", [])
        })

        return {
            "answer": result["result"],
            "sources": sources,
            "context_chunks": len(relevant_docs),
        }

    def draft_document(self, doc_type: str, facts: str) -> str:
        """Draft a legal document (letter, pleading, contract clause, etc.)."""
        prompt = f"""Draft a {doc_type} based on the following facts and applicable law.

Facts:
{facts}

Produce a properly formatted {doc_type} suitable for use in {self.config['agent']['jurisdiction']}.
"""
        return self.analyze_case(prompt)["answer"]

    def explain_law(self, concept: str) -> str:
        """Explain a legal concept in plain language."""
        prompt = f"Explain the following legal concept in plain language as it applies in {self.config['agent']['jurisdiction']}: {concept}"
        return self.analyze_case(prompt)["answer"]
