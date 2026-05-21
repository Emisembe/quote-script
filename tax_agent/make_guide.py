#!/usr/bin/env python3
"""Generate the offline setup guide as a Word .docx file."""

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from pathlib import Path


# ── helpers ────────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  hex_color)
    tcPr.append(shd)


def add_heading(doc, text, level=1, color="1F3864"):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor.from_string(color)
    return h


def add_body(doc, text):
    p = doc.add_paragraph(text)
    p.paragraph_format.space_after = Pt(6)
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(text, style="List Bullet")
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    return p


def add_code_block(doc, code_text, label=None):
    if label:
        lp = doc.add_paragraph()
        lp.paragraph_format.space_after = Pt(0)
        run = lp.add_run(label)
        run.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    for line in code_text.strip().split("\n"):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after  = Pt(0)
        p.paragraph_format.left_indent  = Inches(0.3)
        run = p.add_run(line if line else " ")
        run.font.name = "Courier New"
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0xD6, 0x33, 0x84)
        # light grey background via shading on paragraph
        pPr = p._p.get_or_add_pPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"),   "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"),  "F3F3F3")
        pPr.append(shd)

    doc.add_paragraph()  # spacer


def add_note(doc, text, note_type="NOTE"):
    colors = {"NOTE": ("2980B9", "EBF5FB"), "TIP": ("27AE60", "EAFAF1"), "WARNING": ("E74C3C", "FDEDEC")}
    fg, bg = colors.get(note_type, ("555555", "F9F9F9"))
    p = doc.add_paragraph()
    p.paragraph_format.left_indent  = Inches(0.3)
    p.paragraph_format.right_indent = Inches(0.3)
    r1 = p.add_run(f"{note_type}: ")
    r1.bold = True
    r1.font.color.rgb = RGBColor.from_string(fg)
    r2 = p.add_run(text)
    r2.font.size = Pt(10)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"),   "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"),  bg)
    pPr.append(shd)
    doc.add_paragraph()


def add_table(doc, headers, rows, header_bg="1F3864", header_fg="FFFFFF"):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT

    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_bg(hdr_cells[i], header_bg)
        run = hdr_cells[i].paragraphs[0].runs[0]
        run.bold = True
        run.font.color.rgb = RGBColor.from_string(header_fg)
        run.font.size = Pt(10)

    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = str(val)
            cells[i].paragraphs[0].runs[0].font.size = Pt(10)

    doc.add_paragraph()
    return table


# ── main document ──────────────────────────────────────────────────────────────

def build():
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin    = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin   = Cm(2.5)
        section.right_margin  = Cm(2.5)

    # ── COVER ──────────────────────────────────────────────────────────────────
    doc.add_paragraph()
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("Offline Accounting & Tax Consultant")
    r.bold = True
    r.font.size = Pt(26)
    r.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = sub.add_run("Complete Setup & User Guide")
    r2.font.size = Pt(14)
    r2.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    doc.add_paragraph()
    intro = doc.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r3 = intro.add_run(
        "Works for any country  •  Upload your data  •  Get tax & accounting advice\n"
        "Kenya  |  Germany  |  South Africa  |  Any country you configure"
    )
    r3.font.size = Pt(11)
    r3.font.color.rgb = RGBColor(0x27, 0xAE, 0x60)
    r3.italic = True

    doc.add_page_break()

    # ── SECTION 1: WHAT IS THIS ─────────────────────────────────────────────
    add_heading(doc, "1.  What Is This System?", level=1)
    add_body(doc,
        "This is a fully offline accounting and tax agent that you install on your own computer. "
        "You upload your financial data (invoices, expenses, bank transactions) as a simple spreadsheet, "
        "and the system processes it to produce:"
    )
    for item in [
        "Profit & Loss Statement (P&L)",
        "Balance Sheet  (Assets = Liabilities + Equity)",
        "Cash Flow Statement  (Operating / Investing / Financing)",
        "Budget vs Actuals  (how you're tracking against your budget)",
        "Trial Balance  (accounting check — debits must equal credits)",
        "Bank Reconciliation  (match your books to your bank statement)",
        "Key Financial Ratios  (gross margin, net margin, interest coverage, etc.)",
        "Interactive Tax Consultant  (ask questions about your data in plain language)",
    ]:
        add_bullet(doc, item)

    doc.add_paragraph()
    add_body(doc,
        "You can configure it for ANY country — Kenya, Germany, South Africa, UK, USA, or any other — "
        "by editing a simple JSON configuration file with that country's tax rates and rules."
    )
    add_note(doc,
        "Your financial data NEVER leaves your computer. Everything runs locally. "
        "No cloud, no subscription, no internet required (unless you choose to use the Claude AI option).",
        "NOTE"
    )

    # ── SECTION 2: WHAT YOU NEED ────────────────────────────────────────────
    add_heading(doc, "2.  What You Need Before Starting", level=1)

    add_heading(doc, "2.1  Python (required)", level=2)
    add_body(doc,
        "Python is the programming language this system runs on. "
        "It is free, safe, and used by millions of people worldwide."
    )

    add_heading(doc, "How to check if Python is already installed:", level=3)
    add_body(doc, "Open your Terminal (Mac/Linux) or Command Prompt (Windows) and type:")
    add_code_block(doc, "python --version")
    add_body(doc, "You should see something like:  Python 3.10.0  or higher.")
    add_body(doc, "If you get an error, download Python from:")
    add_code_block(doc, "https://www.python.org/downloads/", label="Download Python:")
    add_note(doc,
        "During installation on Windows, tick the box that says 'Add Python to PATH'. "
        "This is very important — if you skip it, commands won't work.",
        "WARNING"
    )

    add_heading(doc, "2.2  Git (to download the project)", level=2)
    add_body(doc, "Git lets you download the project files from GitHub.")
    add_body(doc, "Check if Git is installed:")
    add_code_block(doc, "git --version")
    add_body(doc, "If not installed, download from:")
    add_code_block(doc, "https://git-scm.com/downloads", label="Download Git:")

    add_heading(doc, "2.3  Summary of requirements", level=2)
    add_table(doc,
        ["Requirement", "Version needed", "Where to get it", "Required?"],
        [
            ["Python",     "3.8 or higher",  "python.org/downloads",  "YES"],
            ["Git",        "Any version",     "git-scm.com/downloads", "YES"],
            ["Ollama",     "Any version",     "ollama.ai",             "Only for offline AI"],
            ["Internet",   "—",               "—",                     "Only for Claude AI option"],
        ]
    )

    # ── SECTION 3: INSTALLATION ─────────────────────────────────────────────
    add_heading(doc, "3.  Installation (One-Time Setup)", level=1)
    add_note(doc, "You only do this once. After setup, you just run the system.", "NOTE")

    add_heading(doc, "Step 1 — Open your terminal / command prompt", level=2)
    add_table(doc,
        ["Operating System", "How to open terminal"],
        [
            ["Windows",     "Press Windows key → type 'cmd' → press Enter"],
            ["Mac",         "Press Cmd + Space → type 'Terminal' → press Enter"],
            ["Linux/Ubuntu","Press Ctrl + Alt + T"],
        ]
    )

    add_heading(doc, "Step 2 — Download the project", level=2)
    add_code_block(doc,
        "git clone https://github.com/Emisembe/quote-script.git\n"
        "cd quote-script/tax_agent",
        label="Type this in the terminal:"
    )

    add_heading(doc, "Step 3 — Install the required Python library", level=2)
    add_body(doc, "This installs the Anthropic library (needed only if you want the Claude AI option):")
    add_code_block(doc, "pip install anthropic")
    add_note(doc,
        "If you only want the offline rule-based option, you can skip this step. "
        "The system works with zero installations for the 'rules' provider.",
        "TIP"
    )

    add_heading(doc, "Step 4 — Verify the installation", level=2)
    add_code_block(doc, "python main.py list-countries")
    add_body(doc, "You should see:")
    add_code_block(doc,
        "==================================================\n"
        "  AVAILABLE COUNTRY CONFIGS\n"
        "==================================================\n"
        "  de            Germany               EUR (€)\n"
        "  ke            Kenya                 KES (KSh)\n"
        "  template      My Country            USD ($)"
    )
    add_body(doc, "If you see this, installation is complete.")

    # ── SECTION 4: YOUR DATA ────────────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "4.  Preparing Your Financial Data", level=1)
    add_body(doc,
        "You upload your financial data as a CSV file (a simple spreadsheet that any program can create — "
        "Excel, Google Sheets, LibreOffice Calc, or even Notepad)."
    )

    add_heading(doc, "4.1  Transactions file format", level=2)
    add_body(doc,
        "Create a file called  my_transactions.csv  with these columns:"
    )
    add_table(doc,
        ["Column", "Description", "Example"],
        [
            ["date",         "Date of the transaction",        "2024-01-15"],
            ["account_code", "Account number from COA",        "40100"],
            ["account_name", "Account name",                   "Revenue Stream 1"],
            ["description",  "What the transaction was for",   "Client A invoice"],
            ["debit",        "Amount going OUT (expenses)",    "12000"],
            ["credit",       "Amount coming IN (income)",      "0"],
            ["source_type",  "Where the transaction came from","invoice"],
            ["period",       "Month it belongs to (YYYY-MM)",  "2024-01"],
        ]
    )

    add_heading(doc, "Source types you can use:", level=3)
    add_table(doc,
        ["source_type", "Use for"],
        [
            ["invoice",          "Sales invoices you sent to customers"],
            ["bill",             "Bills / supplier invoices you received"],
            ["bank_transaction", "Payments direct from your bank account"],
            ["credit_card",      "Credit card purchases"],
            ["journal_entry",    "Manual accounting adjustments (e.g. depreciation)"],
        ]
    )

    add_heading(doc, "4.2  Example transactions (copy this as a starting point):", level=2)
    add_code_block(doc,
        "date,account_code,account_name,description,debit,credit,source_type,period\n"
        "2024-01-05,40100,Revenue,Client A invoice,0,50000,invoice,2024-01\n"
        "2024-01-10,50100,Hosting Fees,AWS January,1500,0,bill,2024-01\n"
        "2024-01-15,60600,Salaries,January payroll,25000,0,bank_transaction,2024-01\n"
        "2024-01-18,60420,Rent,Office rent,8000,0,bank_transaction,2024-01\n"
        "2024-01-20,60100,Marketing,Google Ads,3000,0,credit_card,2024-01\n"
        "2024-01-25,80100,Depreciation,Monthly depreciation,500,0,journal_entry,2024-01"
    )

    add_heading(doc, "4.3  Account codes (Chart of Accounts)", level=2)
    add_body(doc,
        "Every transaction must be assigned to an account code. "
        "Use these ranges:"
    )
    add_table(doc,
        ["Range", "Type", "Examples"],
        [
            ["40000–49999", "Income / Revenue",    "40100 = Revenue, 40400 = Subscription Revenue"],
            ["50000–59999", "Cost of Sales (COGS)", "50100 = Hosting, 50300 = Direct Labour"],
            ["60000–69999", "Operating Expenses",  "60100 = Marketing, 60600 = Salaries, 60420 = Rent"],
            ["70000–79999", "Other Income",         "70100 = Interest Income"],
            ["80000–89999", "Other Expenses",       "80100 = Depreciation, 80200 = Interest Expense"],
            ["10000–10399", "Current Assets (BS)",  "10100 = Cash, 10200 = Accounts Receivable"],
            ["10400–10999", "Fixed Assets (BS)",    "10410 = Computers, 10420 = Furniture"],
            ["20000–20399", "Current Liabilities",  "20100 = Accounts Payable"],
            ["20400–29999", "Long Term Liabilities","20411 = Bank Loan"],
            ["30000–39999", "Equity",               "30100 = Share Capital, 30400 = Retained Earnings"],
        ]
    )
    add_note(doc,
        "Run  python main.py list-accounts  to see the full list of all accounts at any time.",
        "TIP"
    )

    # ── SECTION 5: RUNNING REPORTS ──────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "5.  Generating Financial Reports", level=1)
    add_body(doc,
        "Once you have your transactions CSV ready, run this command to generate "
        "a full HTML financial report that opens in any browser:"
    )

    add_heading(doc, "5.1  Basic report (Kenya example):", level=2)
    add_code_block(doc,
        "python main.py report \\\n"
        "  --data data/my_transactions.csv \\\n"
        "  --country ke \\\n"
        "  --output reports/my_report.html"
    )

    add_heading(doc, "5.2  Full report with all features:", level=2)
    add_code_block(doc,
        "python main.py report \\\n"
        "  --data data/my_transactions.csv \\\n"
        "  --country ke \\\n"
        "  --budget data/my_budget.csv \\\n"
        "  --opening data/opening_balances.csv \\\n"
        "  --bank-rec data/bank_reconciliation.csv \\\n"
        "  --period 2024-01 --period 2024-02 --period 2024-03 \\\n"
        "  --output reports/my_report.html"
    )
    add_body(doc, "Then open  reports/my_report.html  in Chrome, Firefox, or Edge.")

    add_heading(doc, "5.3  What the report includes:", level=2)
    add_table(doc,
        ["Section", "What it shows"],
        [
            ["KPI Dashboard",        "Revenue, Gross Margin %, Net Margin % at a glance"],
            ["Profit & Loss",        "Revenue → COGS → Gross Profit → OpEx → EBIT → Net Profit"],
            ["Key Ratios",           "Gross margin, net margin, interest coverage, effective tax rate"],
            ["Cash Flow",            "Cash from operations, investing, and financing"],
            ["Balance Sheet",        "Assets = Liabilities + Equity with BALANCED / OUT BY check"],
            ["Budget vs Actuals",    "Every account: budget, actual, variance, and variance %"],
            ["Trial Balance",        "All accounts with total debits and credits"],
            ["Bank Reconciliation",  "Items in bank not in books, and vice versa"],
        ]
    )

    add_heading(doc, "5.4  Filtering by period:", level=2)
    add_body(doc, "To report on specific months only, add  --period  flags:")
    add_code_block(doc,
        "# January only\n"
        "python main.py report --data data/my_data.csv --country ke --period 2024-01\n\n"
        "# Q1 (January + February + March)\n"
        "python main.py report --data data/my_data.csv --country ke \\\n"
        "  --period 2024-01 --period 2024-02 --period 2024-03"
    )

    # ── SECTION 6: CHAT CONSULTANT ──────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "6.  The AI Tax Consultant (Chat)", level=1)
    add_body(doc,
        "The chat mode lets you have a conversation with the system about your financial data. "
        "You ask questions in plain English, and it answers based on your actual numbers "
        "and the tax rules for your chosen country."
    )

    add_heading(doc, "6.1  Three modes — choose one:", level=2)
    add_table(doc,
        ["Mode", "Command flag", "Works offline?", "Setup needed", "Quality"],
        [
            ["Rule-based",  "--provider rules",  "Yes — always", "None at all",               "Good for common questions"],
            ["Local AI",    "--provider ollama", "Yes — fully",  "Install Ollama + one model", "Very good"],
            ["Claude AI",   "--provider claude", "No",           "API key + internet",         "Best quality advice"],
        ]
    )

    add_heading(doc, "6.2  Starting a chat session (rule-based, zero setup):", level=2)
    add_code_block(doc,
        "python main.py chat \\\n"
        "  --data data/my_transactions.csv \\\n"
        "  --country ke \\\n"
        "  --provider rules"
    )
    add_body(doc, "Then just type your questions:")
    add_code_block(doc,
        "You: What is my corporation tax liability?\n"
        "Consultant: Based on your data:\n"
        "  Profit Before Tax:  KSh 120,000\n"
        "  Tax rate (Kenya): 30%\n"
        "  Estimated tax:    KSh 36,000\n\n"
        "You: Am I required to register for VAT?\n"
        "Consultant: Your revenue (KSh 64,500) is BELOW the KES 5,000,000 threshold\n"
        "  — VAT registration is optional at this stage.\n\n"
        "You: quit"
    )

    add_heading(doc, "6.3  Questions you can ask:", level=2)
    add_table(doc,
        ["Topic", "Example question"],
        [
            ["Tax liability",      "What is my corporation tax?"],
            ["VAT",                "Do I need to register for VAT?"],
            ["Deductions",         "What deductions can I use to reduce my tax?"],
            ["Deadlines",          "When are my filing deadlines?"],
            ["Performance",        "How is my profitability?"],
            ["Cash flow",          "How is my cash flow?"],
            ["Balance sheet",      "What does my balance sheet look like?"],
            ["Budget",             "Where am I over or under budget?"],
            ["Payroll",            "What are my PAYE obligations?"],
            ["General advice",     "What should I focus on this quarter?"],
        ]
    )

    add_heading(doc, "6.4  Special commands inside chat:", level=2)
    add_table(doc,
        ["Command", "What it does"],
        [
            ["summary",   "Shows your full financial data summary"],
            ["context",   "Shows all data the consultant has been given"],
            ["reset",     "Clears the conversation and starts fresh"],
            ["quit",      "Exits the chat session"],
        ]
    )

    # ── SECTION 7: OFFLINE AI WITH OLLAMA ───────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "7.  Setting Up Fully Offline AI (Ollama)", level=1)
    add_body(doc,
        "Ollama runs AI language models on your own computer — no internet required after setup. "
        "This gives you high-quality AI-powered advice completely offline."
    )

    add_heading(doc, "Step 1 — Install Ollama:", level=2)
    add_table(doc,
        ["Operating System", "How to install"],
        [
            ["Mac",     "Open terminal and run:  curl -fsSL https://ollama.ai/install.sh | sh"],
            ["Linux",   "Open terminal and run:  curl -fsSL https://ollama.ai/install.sh | sh"],
            ["Windows", "Download installer from ollama.ai  then run the .exe file"],
        ]
    )

    add_heading(doc, "Step 2 — Download an AI model (internet needed once):", level=2)
    add_body(doc,
        "This downloads the AI model to your computer. After downloading, "
        "no internet is ever needed again."
    )
    add_table(doc,
        ["Model", "Size", "RAM needed", "Best for", "Command to download"],
        [
            ["llama3.2",    "2 GB",  "4 GB RAM",  "Fast, good quality (recommended)", "ollama pull llama3.2"],
            ["mistral",     "4 GB",  "8 GB RAM",  "Better accounting reasoning",      "ollama pull mistral"],
            ["llama3.1:8b", "5 GB",  "8 GB RAM",  "More detailed responses",         "ollama pull llama3.1:8b"],
            ["llama3.3:70b","40 GB", "64 GB RAM", "Best quality, slow",              "ollama pull llama3.3:70b"],
        ]
    )
    add_code_block(doc, "ollama pull llama3.2", label="Recommended — download this:")

    add_heading(doc, "Step 3 — Start Ollama (before using the consultant):", level=2)
    add_code_block(doc, "ollama serve")
    add_note(doc,
        "Leave this terminal window open. Open a second terminal window to run the chat command.",
        "NOTE"
    )

    add_heading(doc, "Step 4 — Run the consultant with Ollama:", level=2)
    add_code_block(doc,
        "python main.py chat \\\n"
        "  --data data/my_transactions.csv \\\n"
        "  --country ke \\\n"
        "  --provider ollama \\\n"
        "  --model llama3.2"
    )
    add_note(doc,
        "After the initial model download, this works 100% offline forever. "
        "No API key, no subscription, no internet.",
        "TIP"
    )

    # ── SECTION 8: ADDING A COUNTRY ─────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "8.  Adding a New Country", level=1)
    add_body(doc,
        "To add any country, you create a JSON configuration file with that country's "
        "tax rates and rules. You only do this once per country."
    )

    add_heading(doc, "Step 1 — Copy the template:", level=2)
    add_code_block(doc,
        "# On Mac/Linux:\n"
        "cp config/countries/template.json config/countries/za.json\n\n"
        "# On Windows:\n"
        "copy config\\countries\\template.json config\\countries\\za.json"
    )

    add_heading(doc, "Step 2 — Edit the file and fill in your country's details:", level=2)
    add_body(doc, "Open the file in any text editor (Notepad, VS Code, TextEdit) and update:")
    add_table(doc,
        ["Field", "What to change", "Example (South Africa)"],
        [
            ["country_name",                     "Full country name",      "South Africa"],
            ["currency_symbol",                   "Currency symbol",        "R"],
            ["currency_code",                     "Currency code",          "ZAR"],
            ["tax → vat → standard_rate",         "VAT rate as a decimal",  "0.15  (for 15%)"],
            ["tax → corporate_income_tax → flat_rate", "CIT rate",          "0.27  (for 27%)"],
            ["key_compliance_dates",              "Filing deadlines",       "VAT: 25th of next month"],
            ["common_deductions",                 "List of tax deductions", "Capital allowances, etc."],
        ]
    )

    add_heading(doc, "Step 3 — Test it:", level=2)
    add_code_block(doc,
        "python main.py list-countries\n"
        "# You should now see your new country listed\n\n"
        "python main.py report --data data/my_data.csv --country za"
    )

    add_heading(doc, "8.1  Quick config for South Africa (SARS):", level=2)
    add_code_block(doc,
        '{\n'
        '  "country_name": "South Africa",\n'
        '  "currency_symbol": "R",\n'
        '  "currency_code": "ZAR",\n'
        '  "tax": {\n'
        '    "vat": { "enabled": true, "standard_rate": 0.15, "label": "VAT" },\n'
        '    "corporate_income_tax": {\n'
        '      "enabled": true,\n'
        '      "method": "flat",\n'
        '      "flat_rate": 0.27,\n'
        '      "label": "Corporate Income Tax (SARS)"\n'
        '    }\n'
        '  }\n'
        '}'
    )

    # ── SECTION 9: BUDGET FILE ──────────────────────────────────────────────
    add_heading(doc, "9.  Budget vs Actuals Setup (Optional)", level=1)
    add_body(doc,
        "To compare your actual spending against your plan, create a budget CSV file."
    )
    add_heading(doc, "Budget file format:", level=2)
    add_code_block(doc,
        "period,account_code,account_name,budget_amount\n"
        "2024-01,40100,Revenue,60000\n"
        "2024-01,60600,Salaries,25000\n"
        "2024-01,60420,Rent,8000\n"
        "2024-02,40100,Revenue,65000\n"
        "2024-02,60600,Salaries,25000"
    )
    add_body(doc, "Then add it to your report command with  --budget data/my_budget.csv")

    # ── SECTION 10: QUICK REFERENCE ─────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "10.  Quick Reference — All Commands", level=1)

    add_table(doc,
        ["Command", "What it does"],
        [
            ["python main.py report --data FILE --country ke",
             "Generate HTML financial report for Kenya"],
            ["python main.py chat --data FILE --country ke --provider rules",
             "Start offline rule-based tax consultant chat"],
            ["python main.py chat --data FILE --country de --provider ollama",
             "Start fully offline AI chat (Germany)"],
            ["python main.py chat --data FILE --country ke --provider claude",
             "Start Claude AI chat (requires internet + API key)"],
            ["python main.py trial-balance --data FILE --opening OPENING",
             "Print trial balance to console"],
            ["python main.py list-accounts",
             "Show all account codes (chart of accounts)"],
            ["python main.py list-countries",
             "Show all configured countries"],
        ]
    )

    add_heading(doc, "10.1  Command options explained:", level=2)
    add_table(doc,
        ["Option", "Meaning", "Example"],
        [
            ["--data",     "Path to your transactions CSV",            "--data data/my_transactions.csv"],
            ["--country",  "Country code (ke, de, template, etc.)",    "--country ke"],
            ["--budget",   "Path to your budget CSV (optional)",       "--budget data/budget.csv"],
            ["--opening",  "Opening balances CSV (for balance sheet)", "--opening data/opening_balances.csv"],
            ["--bank-rec", "Bank reconciliation CSV (optional)",       "--bank-rec data/bank_rec.csv"],
            ["--period",   "Filter to a specific month (repeatable)",  "--period 2024-01 --period 2024-02"],
            ["--output",   "Where to save the HTML report",            "--output reports/q1_report.html"],
            ["--provider", "AI engine: rules / ollama / claude",       "--provider ollama"],
            ["--model",    "Specific AI model to use",                 "--model llama3.2"],
        ]
    )

    # ── SECTION 11: TROUBLESHOOTING ─────────────────────────────────────────
    add_heading(doc, "11.  Troubleshooting", level=1)
    add_table(doc,
        ["Problem", "Solution"],
        [
            ["'python' is not recognized",
             "Python is not in PATH. Reinstall Python and tick 'Add to PATH'."],
            ["'No module named anthropic'",
             "Run:  pip install anthropic"],
            ["'Ollama is not running'",
             "Open a terminal and run:  ollama serve  — keep that window open."],
            ["'ANTHROPIC_API_KEY not set'",
             "Set the key: export ANTHROPIC_API_KEY='sk-ant-...' (Mac/Linux)\n"
             "or set ANTHROPIC_API_KEY=sk-ant-...  (Windows)"],
            ["Report shows wrong currency",
             "Check that --country matches your config file name (ke, de, za, etc.)"],
            ["'Trial Balance does not balance'",
             "Your CSV is missing the other side of some entries. Each transaction\n"
             "needs both a debit and a credit entry to fully balance."],
            ["Report file does not open",
             "Navigate to the reports/ folder and double-click the .html file,\n"
             "or drag it into Chrome/Firefox."],
        ]
    )

    # ── SECTION 12: FILE STRUCTURE ──────────────────────────────────────────
    add_heading(doc, "12.  Project File Structure", level=1)
    add_code_block(doc,
        "quote-script/\n"
        "└── tax_agent/\n"
        "    ├── main.py                    ← Run all commands from here\n"
        "    ├── engine/\n"
        "    │   ├── calculator.py          ← P&L, Balance Sheet, Cash Flow logic\n"
        "    │   ├── consultant.py          ← AI tax consultant engine\n"
        "    │   └── reporter.py            ← HTML report generator\n"
        "    ├── config/\n"
        "    │   ├── chart_of_accounts.json ← Account codes (edit to customise)\n"
        "    │   └── countries/\n"
        "    │       ├── template.json      ← Blank template for any country\n"
        "    │       ├── ke.json            ← Kenya (KRA)\n"
        "    │       ├── de.json            ← Germany (Finanzamt)\n"
        "    │       └── za.json            ← Your custom country (create this)\n"
        "    ├── data/\n"
        "    │   ├── my_transactions.csv    ← YOUR financial data goes here\n"
        "    │   ├── my_budget.csv          ← YOUR budget (optional)\n"
        "    │   └── opening_balances.csv   ← Opening balances (optional)\n"
        "    └── reports/\n"
        "        └── report.html            ← Generated reports appear here"
    )

    # ── SECTION 13: WORKFLOW ────────────────────────────────────────────────
    doc.add_page_break()
    add_heading(doc, "13.  Recommended Monthly Workflow", level=1)

    steps = [
        ("Week 1 of new month",
         "Export your bank statement, credit card statement, and invoices."),
        ("Classify transactions",
         "Add each item to your  my_transactions.csv  with the correct account code."),
        ("Run the report",
         "python main.py report --data data/my_transactions.csv --country ke --period 2024-01"),
        ("Review the HTML report",
         "Open the report in your browser. Check P&L, ratios, and budget variances."),
        ("Bank reconciliation",
         "Update  bank_reconciliation.csv  with matched/unmatched items and re-run the report."),
        ("Ask the consultant",
         "Use  python main.py chat  to ask about tax obligations, deductions, or performance."),
        ("File taxes on time",
         "Check the compliance deadlines section of your country config. Never miss a deadline."),
    ]

    for i, (title, detail) in enumerate(steps, 1):
        p = doc.add_paragraph()
        r1 = p.add_run(f"  Step {i}: {title}")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)
        p2 = doc.add_paragraph(f"  {detail}")
        p2.paragraph_format.left_indent = Inches(0.4)
        p2.paragraph_format.space_after  = Pt(8)

    # ── FOOTER ──────────────────────────────────────────────────────────────
    doc.add_page_break()
    doc.add_paragraph()
    final = doc.add_paragraph()
    final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = final.add_run("Offline Accounting & Tax Agent")
    r.bold = True
    r.font.size = Pt(14)
    r.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

    note = doc.add_paragraph()
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rn = note.add_run(
        "Your data never leaves your computer.\n"
        "This system is a financial tool — for complex tax decisions,\n"
        "always confirm with a licensed accountant in your jurisdiction."
    )
    rn.font.size = Pt(10)
    rn.font.color.rgb = RGBColor(0x7F, 0x8C, 0x8D)
    rn.italic = True

    # ── SAVE ────────────────────────────────────────────────────────────────
    out = Path(__file__).parent / "Offline_Tax_Agent_Setup_Guide.docx"
    doc.save(out)
    print(f"Guide saved: {out}")
    return out


if __name__ == "__main__":
    build()
