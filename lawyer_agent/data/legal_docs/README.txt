LEGAL DOCUMENTS FOLDER
======================

Drop your country's legal documents here. Supported formats:
  - PDF  (.pdf)  — Statutes, acts, court decisions, regulations
  - Text (.txt)  — Penal codes, constitutions, legal summaries
  - Word (.docx) — Any legal documents in Word format
  - Markdown (.md)

EXAMPLES OF WHAT TO ADD:
  - Constitution of [Country].pdf
  - Penal Code [Year].pdf
  - Civil Procedure Act.pdf
  - Land Act.pdf
  - Employment Act.pdf
  - Landmark court decisions (as .txt or .pdf)
  - Legal commentaries and digests

SOURCES FOR LEGAL DOCUMENTS:
  - Your country's official government or parliament website
  - Law reform commission publications
  - Kenya: kenyalaw.org
  - Nigeria: placng.org / lawnigeria.com
  - South Africa: gov.za / saflii.org
  - USA: congress.gov / law.cornell.edu
  - UK: legislation.gov.uk

After adding documents, run:
  python -m scripts.ingest --reset

Subfolders are supported. Organize by category if needed:
  legal_docs/
    criminal/
    civil/
    land/
    employment/
