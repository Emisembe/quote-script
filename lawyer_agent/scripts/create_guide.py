"""Generate the LexAI setup guide as a DOCX file."""

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "LexAI_Setup_Guide.docx")


def set_cell_bg(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def add_heading(doc, text, level=1, color="1F3864"):
    h = doc.add_heading(text, level=level)
    run = h.runs[0] if h.runs else h.add_run(text)
    run.font.color.rgb = RGBColor.from_string(color)
    return h


def add_code_block(doc, code):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(code)
    run.font.name = "Courier New"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x1a, 0x1a, 0x2e)
    # Light grey shading on paragraph
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "F0F0F0")
    pPr.append(shd)
    return p


def add_note(doc, text, note_type="NOTE"):
    colors = {"NOTE": "D6E4F0", "WARNING": "FDEBD0", "TIP": "D5F5E3"}
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(6)
    label = p.add_run(f"  {note_type}: ")
    label.bold = True
    label.font.size = Pt(10)
    body = p.add_run(text)
    body.font.size = Pt(10)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), colors.get(note_type, "F0F0F0"))
    pPr.append(shd)


def build_doc():
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    # ── TITLE PAGE ─────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run("LexAI")
    title_run.font.size = Pt(36)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub_p.add_run("Offline Lawyer Agent — Complete Setup Guide")
    sub_run.font.size = Pt(16)
    sub_run.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    doc.add_paragraph()
    desc_p = doc.add_paragraph()
    desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    desc_run = desc_p.add_run(
        "A fully offline AI legal assistant that works for any country and language.\n"
        "No internet required after setup. Your data stays on your machine."
    )
    desc_run.font.size = Pt(11)
    desc_run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    doc.add_page_break()

    # ── TABLE OF CONTENTS ──────────────────────────────────────
    add_heading(doc, "Table of Contents", 1)
    toc_items = [
        "1.  Operating System Support",
        "2.  Hardware Requirements",
        "3.  Software Prerequisites",
        "4.  Step-by-Step Setup (Windows)",
        "5.  Step-by-Step Setup (macOS)",
        "6.  Step-by-Step Setup (Linux)",
        "7.  Configuring for Your Country & Language",
        "8.  Adding Legal Documents",
        "9.  Running the Agent",
        "10. Usage Examples",
        "11. Switching Countries",
        "12. Troubleshooting",
        "13. Recommended Models by Language",
    ]
    for item in toc_items:
        doc.add_paragraph(item, style="List Number")

    doc.add_page_break()

    # ── SECTION 1: OS SUPPORT ──────────────────────────────────
    add_heading(doc, "1. Operating System Support", 1)
    doc.add_paragraph(
        "Yes — LexAI works on all major operating systems. The table below shows full compatibility:"
    )
    doc.add_paragraph()

    os_table = doc.add_table(rows=1, cols=4)
    os_table.style = "Table Grid"
    os_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Operating System", "Versions Supported", "Difficulty", "Notes"]
    hdr_cells = os_table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(hdr_cells[i], "1F3864")
        hdr_cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    rows = [
        ("Windows", "Windows 10 / 11 (64-bit)", "Easy", "Full GUI installer available"),
        ("macOS", "macOS 12 Monterey and later", "Easy", "Apple Silicon (M1/M2/M3) runs fastest"),
        ("Linux", "Ubuntu 20.04+, Debian, Fedora, Arch", "Medium", "Best performance, most control"),
        ("Raspberry Pi", "Raspberry Pi 4/5 (64-bit OS)", "Advanced", "Slow but functional for small models"),
    ]
    for row in rows:
        cells = os_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    doc.add_paragraph()
    add_note(doc, "All three major OS platforms (Windows, macOS, Linux) are fully supported with identical features.", "TIP")

    doc.add_page_break()

    # ── SECTION 2: HARDWARE ────────────────────────────────────
    add_heading(doc, "2. Hardware Requirements", 1)
    doc.add_paragraph(
        "The hardware you need depends on which AI model you choose. Larger models give better "
        "legal reasoning but need more memory."
    )
    doc.add_paragraph()

    add_heading(doc, "2.1 RAM Requirements", 2)
    ram_table = doc.add_table(rows=1, cols=4)
    ram_table.style = "Table Grid"
    ram_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["RAM", "What You Can Run", "Quality", "Best For"]):
        ram_table.rows[0].cells[i].text = h
        ram_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(ram_table.rows[0].cells[i], "2E4057")
        ram_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for row in [
        ("8 GB", "Llama3 7B, Mistral 7B, Gemma2 2B", "Good", "Basic legal queries, small caseloads"),
        ("16 GB", "Llama3 8B, Mistral 7B, Aya 8B", "Very Good", "Most use cases — recommended"),
        ("32 GB", "Llama3 70B (quantized)", "Excellent", "Complex multi-issue cases"),
        ("64 GB+", "Llama3 70B full, Mixtral", "Best", "Professional / firm-level use"),
    ]:
        cells = ram_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    doc.add_paragraph()
    add_heading(doc, "2.2 GPU (Graphics Card)", 2)
    doc.add_paragraph(
        "A GPU is optional but dramatically speeds up the AI responses. "
        "Without a GPU, the agent still works — it just runs slower on the CPU."
    )

    gpu_table = doc.add_table(rows=1, cols=3)
    gpu_table.style = "Table Grid"
    for i, h in enumerate(["Setup", "Speed", "Who It's For"]):
        gpu_table.rows[0].cells[i].text = h
        gpu_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(gpu_table.rows[0].cells[i], "2E4057")
        gpu_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for row in [
        ("CPU only (no GPU)", "Slow — 1-3 minutes per response", "Budget setups, occasional use"),
        ("NVIDIA GPU (4GB VRAM)", "Fast — 5-15 seconds per response", "Regular use, good experience"),
        ("NVIDIA GPU (8GB+ VRAM)", "Very fast — 2-5 seconds", "Professional/daily use"),
        ("Apple Silicon (M1/M2/M3)", "Fast — 5-10 seconds (uses unified memory)", "Mac users — best value"),
    ]:
        cells = gpu_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    doc.add_paragraph()
    add_heading(doc, "2.3 Storage", 2)
    storage_items = [
        "AI model files: 4 GB – 40 GB (depending on model size)",
        "Embedding model: ~90 MB (downloaded once, runs offline)",
        "Your legal documents + vector store: 1 GB – 5 GB",
        "Python environment: ~2 GB",
        "Total recommended free space: 20 GB minimum",
    ]
    for item in storage_items:
        doc.add_paragraph(item, style="List Bullet")

    add_heading(doc, "2.4 Minimum Recommended Machine", 2)
    add_note(
        doc,
        "Minimum: Any laptop or desktop with 8 GB RAM, 20 GB free storage, and a 64-bit processor "
        "(made after 2015). Recommended: 16 GB RAM, SSD storage, modern CPU (2018 or newer).",
        "NOTE"
    )

    doc.add_page_break()

    # ── SECTION 3: PREREQUISITES ───────────────────────────────
    add_heading(doc, "3. Software Prerequisites", 1)
    doc.add_paragraph("You need to install three things before setting up LexAI:")
    prereqs = [
        ("Ollama", "The offline AI engine that runs the language model on your computer. Free and open source."),
        ("Python 3.9+", "The programming language LexAI is written in. Free."),
        ("Git", "For downloading the LexAI code from GitHub. Free."),
    ]
    for name, desc in prereqs:
        p = doc.add_paragraph(style="List Number")
        run = p.add_run(f"{name}: ")
        run.bold = True
        p.add_run(desc)

    doc.add_page_break()

    # ── SECTION 4: WINDOWS SETUP ──────────────────────────────
    add_heading(doc, "4. Step-by-Step Setup — Windows", 1)

    add_heading(doc, "Step 1: Install Python", 2)
    steps = [
        ('Go to python.org/downloads and download Python 3.11 or newer.', None),
        ('Run the installer. IMPORTANT: Check the box "Add Python to PATH" before clicking Install.', None),
        ('Verify installation by opening Command Prompt and typing:', "python --version"),
    ]
    for text, code in steps:
        doc.add_paragraph(text, style="List Number")
        if code:
            add_code_block(doc, code)

    add_heading(doc, "Step 2: Install Git", 2)
    doc.add_paragraph("Download Git from git-scm.com/download/win and run the installer with default settings.")

    add_heading(doc, "Step 3: Install Ollama", 2)
    doc.add_paragraph("Download Ollama from ollama.com/download and run the Windows installer. Ollama runs as a background service automatically.")

    add_heading(doc, "Step 4: Download an AI Model", 2)
    doc.add_paragraph("Open Command Prompt and run:")
    add_code_block(doc, "ollama pull llama3")
    add_note(doc, "This downloads ~4 GB. You only need to do this once. For multilingual support, use: ollama pull aya", "NOTE")

    add_heading(doc, "Step 5: Download LexAI", 2)
    doc.add_paragraph("Open Command Prompt and run:")
    add_code_block(doc, "git clone https://github.com/Emisembe/quote-script.git\ncd quote-script\\lawyer_agent")

    add_heading(doc, "Step 6: Install LexAI Dependencies", 2)
    add_code_block(doc, "pip install -r requirements.txt")
    add_note(doc, "This may take 5-10 minutes as it downloads AI libraries. Internet is required for this step only.", "NOTE")

    add_heading(doc, "Step 7: Add Legal Documents", 2)
    doc.add_paragraph("Copy your PDF or text files of laws into the folder:")
    add_code_block(doc, "quote-script\\lawyer_agent\\data\\legal_docs\\")

    add_heading(doc, "Step 8: Ingest Documents & Run", 2)
    add_code_block(doc, "python -m scripts.ingest\npython -m scripts.run_agent")

    doc.add_page_break()

    # ── SECTION 5: MACOS SETUP ────────────────────────────────
    add_heading(doc, "5. Step-by-Step Setup — macOS", 1)

    add_heading(doc, "Step 1: Install Homebrew (package manager)", 2)
    doc.add_paragraph("Open Terminal and run:")
    add_code_block(doc, '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')

    add_heading(doc, "Step 2: Install Python and Git", 2)
    add_code_block(doc, "brew install python git")

    add_heading(doc, "Step 3: Install Ollama", 2)
    doc.add_paragraph("Download from ollama.com/download (macOS version) and open the .dmg file, or:")
    add_code_block(doc, "brew install ollama")

    add_heading(doc, "Step 4: Pull an AI Model", 2)
    add_code_block(doc, "ollama pull llama3")
    add_note(doc, "Apple Silicon Macs (M1/M2/M3) run Ollama extremely well using unified memory. A 16 GB MacBook Air handles llama3 comfortably.", "TIP")

    add_heading(doc, "Step 5: Clone and Set Up LexAI", 2)
    add_code_block(doc,
        "git clone https://github.com/Emisembe/quote-script.git\n"
        "cd quote-script/lawyer_agent\n"
        "pip3 install -r requirements.txt"
    )

    add_heading(doc, "Step 6: Add Documents, Ingest, and Run", 2)
    doc.add_paragraph("Copy legal documents to data/legal_docs/, then:")
    add_code_block(doc, "python3 -m scripts.ingest\npython3 -m scripts.run_agent")

    doc.add_page_break()

    # ── SECTION 6: LINUX SETUP ────────────────────────────────
    add_heading(doc, "6. Step-by-Step Setup — Linux (Ubuntu/Debian)", 1)

    add_heading(doc, "Step 1: Update System and Install Dependencies", 2)
    add_code_block(doc,
        "sudo apt update && sudo apt upgrade -y\n"
        "sudo apt install python3 python3-pip git curl -y"
    )

    add_heading(doc, "Step 2: Install Ollama", 2)
    add_code_block(doc, "curl -fsSL https://ollama.com/install.sh | sh")

    add_heading(doc, "Step 3: Start Ollama and Pull a Model", 2)
    add_code_block(doc, "ollama serve &\nollama pull llama3")

    add_heading(doc, "Step 4: Clone and Set Up LexAI", 2)
    add_code_block(doc,
        "git clone https://github.com/Emisembe/quote-script.git\n"
        "cd quote-script/lawyer_agent\n"
        "pip3 install -r requirements.txt"
    )

    add_heading(doc, "Step 5: Add Documents, Ingest, and Run", 2)
    add_code_block(doc, "python3 -m scripts.ingest\npython3 -m scripts.run_agent")

    doc.add_page_break()

    # ── SECTION 7: CONFIGURATION ──────────────────────────────
    add_heading(doc, "7. Configuring for Your Country & Language", 1)
    doc.add_paragraph(
        "Open the file config/settings.yaml in any text editor (Notepad, TextEdit, gedit, VS Code). "
        "Update these key fields:"
    )
    doc.add_paragraph()
    add_code_block(doc,
        "agent:\n"
        "  jurisdiction: \"Kenya\"       # Change to your country\n"
        "  legal_system: \"common_law\"  # common_law | civil_law | mixed\n"
        "  language: \"en\"             # Language code (en, fr, sw, ar, pt, es)\n"
        "\n"
        "llm:\n"
        "  model: \"llama3\"            # Must match what you pulled with ollama pull"
    )

    add_heading(doc, "Legal System Types", 2)
    ls_table = doc.add_table(rows=1, cols=3)
    ls_table.style = "Table Grid"
    for i, h in enumerate(["Legal System", "Setting", "Countries"]):
        ls_table.rows[0].cells[i].text = h
        ls_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(ls_table.rows[0].cells[i], "1F3864")
        ls_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for row in [
        ("Common Law", "common_law", "Kenya, Nigeria, Ghana, South Africa, UK, USA, Australia, India"),
        ("Civil Law", "civil_law", "France, Germany, DRC, Rwanda, Brazil, Mexico, Italy, Spain"),
        ("Mixed System", "mixed", "South Africa, Cameroon, Philippines, Louisiana (USA), Quebec"),
        ("Islamic Law (Sharia)", "civil_law", "Use civil_law and note Sharia applies in system prompt"),
    ]:
        cells = ls_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    doc.add_page_break()

    # ── SECTION 8: ADDING LEGAL DOCS ──────────────────────────
    add_heading(doc, "8. Adding Legal Documents", 1)
    doc.add_paragraph(
        "The quality of LexAI's answers depends entirely on the legal documents you provide. "
        "More documents = better answers."
    )

    add_heading(doc, "8.1 What to Add", 2)
    doc_types = [
        "Constitution of your country",
        "Penal / Criminal Code",
        "Civil Procedure Act / Code",
        "Land / Property Acts",
        "Employment / Labour Act",
        "Companies Act",
        "Evidence Act",
        "Family Law Act",
        "Tax legislation",
        "Landmark court judgments (as .txt or .pdf)",
        "Legal commentaries and digests",
    ]
    for item in doc_types:
        doc.add_paragraph(item, style="List Bullet")

    add_heading(doc, "8.2 Where to Find Legal Documents (Free)", 2)
    sources = [
        ("Kenya", "kenyalaw.org"),
        ("Nigeria", "placng.org  /  lawnigeria.com"),
        ("South Africa", "gov.za  /  saflii.org"),
        ("Ghana", "ghanalegalresearch.com"),
        ("Tanzania", "lrct.go.tz"),
        ("Uganda", "ulii.org"),
        ("USA", "congress.gov  /  law.cornell.edu"),
        ("UK", "legislation.gov.uk"),
        ("France", "legifrance.gouv.fr"),
        ("Any country", "worldlii.org  (global legal database)"),
    ]
    src_table = doc.add_table(rows=1, cols=2)
    src_table.style = "Table Grid"
    for i, h in enumerate(["Country", "Source"]):
        src_table.rows[0].cells[i].text = h
        src_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(src_table.rows[0].cells[i], "2E4057")
        src_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for row in sources:
        cells = src_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    add_heading(doc, "8.3 Folder Organization (Optional)", 2)
    doc.add_paragraph("You can organize documents in subfolders:")
    add_code_block(doc,
        "data/legal_docs/\n"
        "    criminal/\n"
        "        Penal_Code.pdf\n"
        "    civil/\n"
        "        Civil_Procedure_Act.pdf\n"
        "    land/\n"
        "        Land_Act.pdf\n"
        "    employment/\n"
        "        Employment_Act.pdf"
    )

    doc.add_page_break()

    # ── SECTION 9: RUNNING ─────────────────────────────────────
    add_heading(doc, "9. Running the Agent", 1)

    add_heading(doc, "First-time setup sequence", 2)
    first_time = [
        "Make sure Ollama is running (it starts automatically on Windows/Mac; on Linux run: ollama serve &)",
        "Navigate to the lawyer_agent folder in your terminal",
        "Run ingestion to index your documents:",
    ]
    for item in first_time:
        doc.add_paragraph(item, style="List Number")
    add_code_block(doc, "python -m scripts.ingest")
    doc.add_paragraph("4. Start the agent:", style="List Number")
    add_code_block(doc, "python -m scripts.run_agent")

    add_heading(doc, "After adding new documents", 2)
    doc.add_paragraph("Re-run ingestion to include the new files:")
    add_code_block(doc, "python -m scripts.ingest --reset")

    doc.add_page_break()

    # ── SECTION 10: USAGE EXAMPLES ────────────────────────────
    add_heading(doc, "10. Usage Examples", 1)
    doc.add_paragraph("Once the agent is running, you will see a prompt. Type naturally or use commands:")

    examples = [
        ("/case", "Analyze a full case",
         "/case My employer dismissed me without notice after 4 years. I have a written employment contract. What are my legal options?"),
        ("/draft", "Draft a legal document",
         "/draft demand letter | Tenant owes 3 months rent totaling KES 45,000. Lease ends next month."),
        ("/explain", "Explain a legal term",
         "/explain What is 'mens rea' and how does it apply in criminal cases?"),
        ("Free text", "General legal question",
         "What are the rights of a suspect during police arrest in Nigeria?"),
    ]
    for cmd, purpose, example in examples:
        add_heading(doc, f"{cmd} — {purpose}", 2)
        add_code_block(doc, example)

    doc.add_page_break()

    # ── SECTION 11: SWITCHING COUNTRIES ───────────────────────
    add_heading(doc, "11. Switching Countries", 1)
    doc.add_paragraph("To switch the agent to a different country:")
    steps_switch = [
        "Edit config/settings.yaml — update jurisdiction, legal_system, and language",
        "Remove or archive the old documents from data/legal_docs/",
        "Add the new country's legal documents to data/legal_docs/",
        "Re-run ingestion with --reset to rebuild the knowledge base:",
    ]
    for s in steps_switch:
        doc.add_paragraph(s, style="List Number")
    add_code_block(doc, "python -m scripts.ingest --reset")
    add_note(doc, "You can maintain separate legal_docs folders per country (e.g. legal_docs_kenya/, legal_docs_nigeria/) and swap the path in settings.yaml when switching.", "TIP")

    doc.add_page_break()

    # ── SECTION 12: TROUBLESHOOTING ───────────────────────────
    add_heading(doc, "12. Troubleshooting", 1)

    issues = [
        (
            '"Vector store not found" error',
            'You have not run the ingestion step yet. Run: python -m scripts.ingest'
        ),
        (
            '"Connection refused" or Ollama not responding',
            'Ollama is not running. On Windows/Mac it starts automatically. On Linux, run: ollama serve'
        ),
        (
            '"No documents found" during ingestion',
            'No files are in data/legal_docs/. Add PDF or TXT files there first.'
        ),
        (
            'Responses are very slow',
            'You are running on CPU only. This is normal — responses take 1-5 minutes. For faster results, use a machine with a GPU or Apple Silicon.'
        ),
        (
            '"pip install" fails',
            'Make sure Python is installed correctly and you are connected to the internet. Try: pip install --upgrade pip, then retry.'
        ),
        (
            'Wrong language in responses',
            'Update the language field in config/settings.yaml to the correct ISO code (e.g. fr for French, sw for Swahili) and use a multilingual model like aya.'
        ),
        (
            'Poor quality answers',
            'Add more and better-quality legal documents to data/legal_docs/ and re-run ingestion. The agent is only as good as the laws you give it.'
        ),
    ]

    for problem, solution in issues:
        p = doc.add_paragraph()
        run = p.add_run(f"Problem: {problem}")
        run.bold = True
        run.font.color.rgb = RGBColor(0xC0, 0x39, 0x2B)
        s = doc.add_paragraph()
        s.add_run(f"Solution: {solution}")
        s.paragraph_format.left_indent = Cm(0.5)
        doc.add_paragraph()

    doc.add_page_break()

    # ── SECTION 13: MODELS BY LANGUAGE ────────────────────────
    add_heading(doc, "13. Recommended Models by Language", 1)
    doc.add_paragraph(
        "Different models perform better for different languages. Use this table to pick the right one:"
    )
    doc.add_paragraph()

    lang_table = doc.add_table(rows=1, cols=4)
    lang_table.style = "Table Grid"
    for i, h in enumerate(["Language", "Recommended Model", "Ollama Command", "Notes"]):
        lang_table.rows[0].cells[i].text = h
        lang_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        set_cell_bg(lang_table.rows[0].cells[i], "1F3864")
        lang_table.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    lang_rows = [
        ("English", "llama3", "ollama pull llama3", "Best overall quality"),
        ("French", "aya", "ollama pull aya", "Covers Francophone Africa, France"),
        ("Swahili", "aya", "ollama pull aya", "East Africa — Kenya, Tanzania, Uganda"),
        ("Arabic", "aya", "ollama pull aya", "North Africa, Middle East"),
        ("Portuguese", "aya", "ollama pull aya", "Angola, Mozambique, Brazil, Portugal"),
        ("Spanish", "mistral", "ollama pull mistral", "Latin America, Spain"),
        ("Hausa / Yoruba", "aya", "ollama pull aya", "West Africa — note: quality is improving"),
        ("Zulu / Xhosa", "aya", "ollama pull aya", "South Africa"),
        ("Hindi", "aya", "ollama pull aya", "India"),
        ("Multilingual", "aya", "ollama pull aya", "Best choice when serving multiple languages"),
    ]
    for row in lang_rows:
        cells = lang_table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = val

    doc.add_paragraph()
    add_note(
        doc,
        "After pulling a new model, update the 'model' field in config/settings.yaml and restart the agent.",
        "NOTE"
    )

    # ── FOOTER NOTE ───────────────────────────────────────────
    doc.add_page_break()
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fr = footer_p.add_run(
        "DISCLAIMER\n\n"
        "LexAI is a legal research and drafting tool powered by artificial intelligence. "
        "It does not constitute formal legal advice and should not be used as a substitute "
        "for a licensed attorney. Always verify AI-generated legal analysis with qualified "
        "legal counsel before taking legal action."
    )
    fr.font.size = Pt(9)
    fr.font.color.rgb = RGBColor(0x77, 0x77, 0x77)
    fr.font.italic = True

    return doc


if __name__ == "__main__":
    doc = build_doc()
    out = os.path.abspath(OUTPUT_PATH)
    doc.save(out)
    print(f"Guide saved to: {out}")
