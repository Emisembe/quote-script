"""
AI Tax Consultant engine.

Providers:
  claude  — Anthropic Claude API (requires ANTHROPIC_API_KEY env var)
  ollama  — Local Ollama (truly offline, requires `ollama` running locally)
  rules   — Pure rule-based responses, no LLM (always offline, no setup)
"""

import json
import os
import urllib.request
import urllib.error
from pathlib import Path

BASE = Path(__file__).parent.parent

SYSTEM_PROMPT = """You are a senior accountant and tax consultant with 20+ years of experience.
You have been given a client's financial data and their country's tax rules.

Your role:
1. Analyse the financial data and identify key issues, risks, and opportunities
2. Answer tax and accounting questions based on the actual numbers provided
3. Flag compliance obligations (filing deadlines, VAT registration thresholds, etc.)
4. Suggest legitimate tax optimisation strategies
5. Explain concepts in plain language the client can understand
6. Always be specific — reference actual figures from the data
7. If you are uncertain about a specific legal interpretation, say so and recommend
   consulting a licensed tax professional in that jurisdiction

Rules:
- Only advise on the country whose tax rules have been provided
- Do not invent tax rates or rules — use only what is in the context
- If the data is insufficient to answer, say what additional information is needed
- Keep responses focused and practical"""


def build_financial_context(pl, ratios, balance_sheet=None, cash_flow=None, bva=None, periods=None):
    """Convert processed financial data into a text summary for the LLM."""
    sym = ""
    lines = ["=== CLIENT FINANCIAL DATA ==="]

    if periods:
        lines.append(f"Reporting periods: {', '.join(sorted(set(periods)))}")

    lines += [
        "",
        "--- PROFIT & LOSS ---",
        f"Revenue:              {pl['revenue']:>12,.2f}",
        f"Other Income:         {pl['other_income']:>12,.2f}",
        f"Total Income:         {pl['total_income']:>12,.2f}",
        f"Cost of Sales (COGS): {pl['cogs']:>12,.2f}",
        f"Gross Profit:         {pl['gross_profit']:>12,.2f}  ({pl['gross_margin_pct']}%)",
        f"Operating Expenses:   {pl['opex']:>12,.2f}",
        f"Depreciation:         {pl['depreciation']:>12,.2f}",
        f"EBIT:                 {pl['ebit']:>12,.2f}  ({pl['operating_margin_pct']}%)",
        f"Interest Expense:     {pl['interest_expense']:>12,.2f}",
        f"Profit Before Tax:    {pl['profit_before_tax']:>12,.2f}",
        f"Tax Calculated:       {pl['tax_amount']:>12,.2f}  (effective rate: {pl['effective_tax_rate_pct']}%)",
        f"Net Profit:           {pl['net_profit']:>12,.2f}  ({pl['net_margin_pct']}%)",
        "",
        "--- KEY RATIOS ---",
    ]
    for k, v in ratios.items():
        lines.append(f"  {k:<30} {v}")

    if balance_sheet and isinstance(balance_sheet, dict) and "current_assets" in balance_sheet:
        bs = balance_sheet
        lines += [
            "",
            "--- BALANCE SHEET ---",
            f"Current Assets:       {bs['current_assets']:>12,.2f}",
            f"Fixed Assets:         {bs['fixed_assets']:>12,.2f}",
            f"TOTAL ASSETS:         {bs['total_assets']:>12,.2f}",
            f"Current Liabilities:  {bs['current_liabilities']:>12,.2f}",
            f"Long Term Liabilities:{bs['long_term_liabilities']:>12,.2f}",
            f"TOTAL LIABILITIES:    {bs['total_liabilities']:>12,.2f}",
            f"Equity:               {bs['equity']:>12,.2f}",
            f"Balance Sheet Status: {'BALANCED' if bs['balanced'] else ('OUT BY ' + str(round(abs(bs['difference']),2)))}",
        ]

    if cash_flow:
        cf = cash_flow
        lines += [
            "",
            "--- CASH FLOW ---",
            f"Cash from Operations: {cf['cash_from_operations']:>12,.2f}",
            f"Cash from Investing:  {cf['cash_from_investing']:>12,.2f}",
            f"Cash from Financing:  {cf['cash_from_financing']:>12,.2f}",
            f"Net Cash Change:      {cf['net_cash_change']:>12,.2f}",
        ]

    if bva:
        total_budget  = sum(r["budget"] for r in bva)
        total_actual  = sum(r["actual"] for r in bva)
        total_var     = total_actual - total_budget
        lines += [
            "",
            "--- BUDGET VS ACTUALS (summary) ---",
            f"Total Budgeted:       {total_budget:>12,.2f}",
            f"Total Actual:         {total_actual:>12,.2f}",
            f"Total Variance:       {total_var:>12,.2f}",
            "Notable variances:",
        ]
        for r in sorted(bva, key=lambda x: abs(x["variance"]), reverse=True)[:5]:
            sign = "+" if r["variance"] >= 0 else ""
            lines.append(f"  {r['account_name']:<30} {sign}{r['variance']:,.2f} ({sign}{r['variance_pct'] or 0:.1f}%)")

    return "\n".join(lines)


def build_tax_context(config):
    """Convert country config into a readable tax rules summary for the LLM."""
    lines = [
        f"=== TAX RULES: {config['country_name'].upper()} ===",
        f"Currency: {config['currency_code']} ({config['currency_symbol']})",
        "",
        "--- TAX RATES & RULES ---",
    ]

    tax = config.get("tax", {})

    # VAT
    vat = tax.get("vat", {})
    if vat.get("enabled"):
        lines += [
            f"VAT ({vat.get('label', 'VAT')}):",
            f"  Standard rate: {vat['standard_rate']*100:.0f}%",
        ]
        if vat.get("reduced_rate"):
            lines.append(f"  Reduced rate: {vat['reduced_rate']*100:.0f}%")
        if vat.get("registration_threshold_kes"):
            lines.append(f"  Registration threshold: KES {vat['registration_threshold_kes']:,}")
        if vat.get("registration_threshold_eur"):
            lines.append(f"  Registration threshold: EUR {vat['registration_threshold_eur']:,}")
        if vat.get("filing_frequency"):
            lines.append(f"  Filing: {vat['filing_frequency']}, due {vat.get('due_date','')}")

    # Corporate Income Tax
    cit = tax.get("corporate_income_tax", {})
    if cit.get("enabled"):
        cit_label = cit.get('label', 'CIT')
        lines += ["", f"Corporate Tax ({cit_label}):"]
        if cit.get("method") == "flat":
            lines.append(f"  Flat rate: {cit['flat_rate']*100:.1f}%")
        elif cit.get("method") == "brackets":
            for b in cit.get("brackets", []):
                hi = f"{b['to']:,}" if b.get("to") else "and above"
                lines.append(f"  {b['from']:>10,} – {hi}: {b['rate']*100:.0f}%")
        if cit.get("solidarity_surcharge"):
            lines.append(f"  Solidarity surcharge: {cit['solidarity_surcharge']*100:.1f}% on CIT")
        if cit.get("effective_rate_note"):
            lines.append(f"  Note: {cit['effective_rate_note']}")
        if cit.get("filing_deadline"):
            lines.append(f"  Filing deadline: {cit['filing_deadline']}")
        if cit.get("instalment_tax"):
            lines.append(f"  Instalments: {cit['instalment_tax']}")

    # Trade tax (Germany)
    gte = tax.get("trade_tax", {})
    if gte.get("enabled"):
        lines += ["", f"Trade Tax ({gte.get('label', 'Trade Tax')}):"]
        lines.append(f"  {gte.get('note', '')}")

    # WHT
    wht = tax.get("withholding_tax", {})
    if wht.get("enabled"):
        lines += ["", f"Withholding Tax:"]
        for k, v in wht.items():
            if isinstance(v, float):
                lines.append(f"  {k.replace('_', ' ').title()}: {v*100:.0f}%")

    # Payroll
    paye = tax.get("paye", {})
    if paye.get("enabled"):
        lines += ["", f"Payroll Tax ({paye.get('label','PAYE')}):"]
        if paye.get("brackets"):
            for b in paye["brackets"]:
                hi = f"{b['to']:,}" if b.get("to") else "+"
                lines.append(f"  {b['from']:>10,} – {hi}: {b['rate']*100:.0f}%")

    # TOT (Kenya)
    tot = tax.get("turnover_tax", {})
    if tot.get("enabled"):
        lines += ["", f"Turnover Tax ({tot.get('label', 'TOT')}):"]
        lines.append(f"  Rate: {tot['rate']*100:.1f}%")
        lines.append(f"  Applies to businesses with turnover KES {tot.get('threshold_min_kes', 0):,} – {tot.get('threshold_max_kes', 0):,}")
        lines.append(f"  Note: {tot.get('note', '')}")

    # Compliance dates
    dates = config.get("key_compliance_dates", {})
    if dates:
        lines += ["", "--- COMPLIANCE DEADLINES ---"]
        for obligation, deadline in dates.items():
            lines.append(f"  {obligation:<40} {deadline}")

    # Common deductions
    deductions = config.get("common_deductions", [])
    if deductions:
        lines += ["", "--- COMMON DEDUCTIONS AVAILABLE ---"]
        for d in deductions:
            lines.append(f"  • {d}")

    # Entity type
    bk = config.get("bookkeeping", {})
    entity_code = bk.get("entity_type", "")
    entity_info = config.get("entity_tax_treatment", {}).get(entity_code, {})
    if entity_info:
        lines += [
            "",
            "--- ENTITY TYPE ---",
            f"  Type: {entity_info.get('label', entity_code)}",
            f"  Tax method: {entity_info.get('tax_method', '')}",
            f"  Double taxation: {'Yes' if entity_info.get('double_taxation') else 'No'}",
        ]
        if entity_info.get("notes"):
            lines.append(f"  Notes: {entity_info['notes']}")

    return "\n".join(lines)


# ── LLM providers ─────────────────────────────────────────────────────────────

def query_claude(messages, model="claude-sonnet-4-6"):
    """Call Anthropic Claude API (requires ANTHROPIC_API_KEY)."""
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("Run: pip install anthropic")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY not set.\n"
            "Export it: export ANTHROPIC_API_KEY='sk-ant-...'\n"
            "Or use --provider ollama for fully offline mode."
        )

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model=model,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


def query_ollama(messages, model="llama3.2"):
    """Call local Ollama (fully offline). Install: https://ollama.ai"""
    url = "http://localhost:11434/api/chat"
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "stream": False,
    }).encode()

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            return data["message"]["content"]
    except urllib.error.URLError:
        raise RuntimeError(
            "Ollama is not running or not installed.\n"
            "Install: https://ollama.ai\n"
            "Then run: ollama pull llama3.2\n"
            "Then start: ollama serve"
        )


def query_rules(question, financial_context, tax_context, pl, ratios, config):
    """
    Purely rule-based responses — no LLM required.
    Works offline, zero setup, covers common questions.
    """
    q = question.lower()
    sym = config["currency_symbol"]
    tax = config.get("tax", {})
    cit = tax.get("corporate_income_tax", {})
    vat_cfg = tax.get("vat", {})

    revenue = pl["revenue"]
    profit  = pl["profit_before_tax"]
    net     = pl["net_profit"]
    gm      = pl["gross_margin_pct"]
    nm      = pl["net_margin_pct"]

    # --- Tax calculation questions ---
    if any(w in q for w in ["tax", "cit", "corporation", "körperschaft", "kra"]):
        tax_rate = cit.get("flat_rate", 0.30)
        estimated_tax = max(profit * tax_rate, 0)
        sol_sur = cit.get("solidarity_surcharge", 0)
        sol_amt = estimated_tax * sol_sur if sol_sur else 0
        resp = [
            f"Based on your data:",
            f"  Profit Before Tax:  {sym}{profit:,.2f}",
            f"  Tax rate ({config['country_name']}): {tax_rate*100:.0f}%",
            f"  Estimated tax:      {sym}{estimated_tax:,.2f}",
        ]
        if sol_sur:
            resp.append(f"  Solidarity surcharge ({sol_sur*100:.1f}%): {sym}{sol_amt:,.2f}")
        tot_cfg = tax.get("turnover_tax", {})
        if tot_cfg.get("enabled"):
            if tot_cfg.get("threshold_min_kes", 0) <= revenue <= tot_cfg.get("threshold_max_kes", float("inf")):
                tot_tax = revenue * tot_cfg["rate"]
                resp += [
                    f"\nTurnover Tax (TOT) alternative:",
                    f"  If you elect TOT: {tot_cfg['rate']*100:.1f}% × {sym}{revenue:,.2f} = {sym}{tot_tax:,.2f}",
                    f"  {'TOT is CHEAPER' if tot_tax < estimated_tax else 'CIT is CHEAPER'} for you.",
                ]
        return "\n".join(resp)

    # --- VAT questions ---
    if any(w in q for w in ["vat", "umsatzsteuer", "sales tax"]):
        rate = vat_cfg.get("standard_rate", 0)
        threshold_kes = vat_cfg.get("registration_threshold_kes")
        threshold_eur = vat_cfg.get("registration_threshold_eur")
        threshold = threshold_kes or threshold_eur or 0
        vat_on_revenue = revenue * rate
        resp = [
            f"VAT Analysis ({config['country_name']}):",
            f"  Standard VAT rate: {rate*100:.0f}%",
            f"  VAT on your revenue: {sym}{vat_on_revenue:,.2f}",
        ]
        if threshold:
            currency = "KES" if threshold_kes else "EUR"
            if revenue > threshold:
                resp.append(f"  Your revenue ({sym}{revenue:,.2f}) EXCEEDS the {currency}{threshold:,} threshold — you MUST be VAT registered.")
            else:
                resp.append(f"  Your revenue ({sym}{revenue:,.2f}) is BELOW the {currency}{threshold:,} threshold — VAT registration is optional.")
        if vat_cfg.get("due_date"):
            resp.append(f"  Filing deadline: {vat_cfg['due_date']}")
        return "\n".join(resp)

    # --- Profit / performance questions ---
    if any(w in q for w in ["profit", "margin", "performance", "how am i doing", "revenue"]):
        lines = [
            f"Financial Performance Summary:",
            f"  Revenue:        {sym}{revenue:,.2f}",
            f"  Gross Margin:   {gm}%  {'(Good)' if gm and gm > 40 else '(Review COGS)' if gm else ''}",
            f"  Net Margin:     {nm}%  {'(Healthy)' if nm and nm > 10 else '(Thin margins)' if nm else ''}",
            f"  Net Profit:     {sym}{net:,.2f}",
        ]
        if gm and gm < 20:
            lines.append("  WARNING: Low gross margin — review pricing or cost of sales.")
        if nm and nm < 5:
            lines.append("  WARNING: Very thin net margin — review operating costs.")
        return "\n".join(lines)

    # --- Deductions questions ---
    if any(w in q for w in ["deduct", "save", "reduce", "optimis", "allowance"]):
        deductions = config.get("common_deductions", [])
        if deductions:
            lines = [f"Available deductions in {config['country_name']}:"]
            for d in deductions:
                lines.append(f"  • {d}")
            return "\n".join(lines)

    # --- Compliance / deadlines ---
    if any(w in q for w in ["deadline", "when", "due", "compliance", "filing", "submit"]):
        dates = config.get("key_compliance_dates", {})
        if dates:
            lines = [f"Key compliance dates for {config['country_name']}:"]
            for obligation, deadline in dates.items():
                lines.append(f"  {obligation:<40} {deadline}")
            return "\n".join(lines)

    # --- Balance sheet / assets ---
    if any(w in q for w in ["asset", "liabilit", "balance sheet", "equity"]):
        return (
            f"Balance Sheet snapshot:\n"
            f"  See the full Balance Sheet in your HTML report.\n"
            f"  Fundamental rule: Assets = Liabilities + Equity\n"
            f"  Assets = what you OWN\n"
            f"  Liabilities = what you OWE to creditors\n"
            f"  Equity = what you OWE to owners (retained earnings + capital)"
        )

    # Default: show a summary
    return (
        f"Here is a quick summary of your financials:\n"
        f"  Revenue: {sym}{revenue:,.2f} | Gross Margin: {gm}% | Net Margin: {nm}%\n\n"
        f"Ask me about: tax, VAT, deductions, deadlines, profit, cash flow, balance sheet.\n"
        f"For AI-powered advice, run with --provider claude or --provider ollama."
    )


# ── Session ────────────────────────────────────────────────────────────────────

class ConsultantSession:
    """Maintains conversation history for multi-turn chat."""

    def __init__(self, financial_context, tax_context, provider="claude",
                 model=None, pl=None, ratios=None, config=None):
        self.financial_context = financial_context
        self.tax_context       = tax_context
        self.provider          = provider
        self.model             = model
        self.pl                = pl
        self.ratios            = ratios
        self.config            = config
        self.history           = []

        # First message primes the LLM with all context
        self._context_message = (
            f"{financial_context}\n\n"
            f"{tax_context}\n\n"
            "Please acknowledge that you have received the client's financial data "
            "and are ready to answer questions as their tax consultant."
        )

    def ask(self, question):
        """Ask a question. Returns the consultant's response as a string."""
        if self.provider == "rules":
            return query_rules(
                question, self.financial_context, self.tax_context,
                self.pl, self.ratios, self.config
            )

        # First turn includes all context
        if not self.history:
            self.history.append({"role": "user", "content": self._context_message})
            if self.provider == "claude":
                primer = query_claude(self.history, model=self.model or "claude-sonnet-4-6")
            else:
                primer = query_ollama(self.history, model=self.model or "llama3.2")
            self.history.append({"role": "assistant", "content": primer})

        self.history.append({"role": "user", "content": question})

        if self.provider == "claude":
            response = query_claude(self.history, model=self.model or "claude-sonnet-4-6")
        else:
            response = query_ollama(self.history, model=self.model or "llama3.2")

        self.history.append({"role": "assistant", "content": response})
        return response

    def reset(self):
        self.history = []
