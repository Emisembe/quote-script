import json
import csv
from pathlib import Path
from collections import defaultdict


BASE = Path(__file__).parent.parent


def load_config(country_code="template"):
    path = BASE / "config" / "countries" / f"{country_code.lower()}.json"
    with open(path) as f:
        return json.load(f)


def load_coa():
    with open(BASE / "config" / "chart_of_accounts.json") as f:
        return json.load(f)["accounts"]


def _account_group(coa, code):
    """Return the COA group key for an account code."""
    for group, data in coa.items():
        if code in data["accounts"]:
            return group
    # fallback: match by range prefix
    code_num = int(code)
    for group, data in coa.items():
        lo, hi = data["range"].split("-")
        if int(lo) <= code_num <= int(hi):
            return group
    return "unknown"


def load_transactions(csv_path):
    rows = []
    with open(csv_path) as f:
        for row in csv.DictReader(f):
            rows.append({
                "date":         row.get("date", ""),
                "period":       row.get("period", row.get("date", "")[:7]),
                "account_code": row.get("account_code", "").strip(),
                "account_name": row.get("account_name", "").strip(),
                "description":  row.get("description", ""),
                "debit":        float(row.get("debit", 0) or 0),
                "credit":       float(row.get("credit", 0) or 0),
                "source_type":  row.get("source_type", ""),
            })
    return rows


def load_budget(csv_path):
    rows = []
    with open(csv_path) as f:
        for row in csv.DictReader(f):
            rows.append({
                "period":       row.get("period", ""),
                "account_code": row.get("account_code", "").strip(),
                "account_name": row.get("account_name", "").strip(),
                "budget":       float(row.get("budget_amount", 0) or 0),
            })
    return rows


def _net(transactions, coa, groups, use_credit_as_positive=True):
    """Sum transactions for given COA group keys."""
    total = 0
    for t in transactions:
        if _account_group(coa, t["account_code"]) in groups:
            if use_credit_as_positive:
                total += t["credit"] - t["debit"]
            else:
                total += t["debit"] - t["credit"]
    return total


def build_pl(transactions, coa, config, periods=None):
    """Build Profit & Loss statement."""
    if periods:
        transactions = [t for t in transactions if t["period"] in periods]

    revenue      = _net(transactions, coa, {"income"},            use_credit_as_positive=True)
    other_income = _net(transactions, coa, {"other_income"},      use_credit_as_positive=True)
    cogs         = _net(transactions, coa, {"cogs"},              use_credit_as_positive=False)
    opex         = _net(transactions, coa, {"operating_expenses"},use_credit_as_positive=False)
    depreciation = _net(transactions, coa, {"other_expenses"},    use_credit_as_positive=False)
    interest_exp = 0

    # split other_expenses into depreciation vs interest
    depr_codes   = {"80100", "80300"}
    int_codes    = {"80200"}
    depreciation = 0
    interest_exp = 0
    for t in transactions:
        if t["account_code"] in depr_codes:
            depreciation += t["debit"] - t["credit"]
        elif t["account_code"] in int_codes:
            interest_exp += t["debit"] - t["credit"]

    gross_profit      = revenue - cogs
    ebit              = gross_profit - opex - depreciation
    profit_before_tax = ebit + other_income - interest_exp

    tax_cfg = config["tax"]["corporate_income_tax"]
    tax_amount = 0
    if tax_cfg["enabled"] and profit_before_tax > 0:
        if tax_cfg["method"] == "flat":
            tax_amount = profit_before_tax * tax_cfg["flat_rate"]
        else:
            tax_amount = _bracketed_tax(profit_before_tax, tax_cfg["brackets"])

    net_profit = profit_before_tax - tax_amount

    return {
        "revenue":            revenue,
        "other_income":       other_income,
        "total_income":       revenue + other_income,
        "cogs":               cogs,
        "gross_profit":       gross_profit,
        "gross_margin_pct":   _pct(gross_profit, revenue),
        "opex":               opex,
        "depreciation":       depreciation,
        "ebit":               ebit,
        "operating_margin_pct": _pct(ebit, revenue),
        "interest_expense":   interest_exp,
        "profit_before_tax":  profit_before_tax,
        "tax_amount":         tax_amount,
        "effective_tax_rate_pct": _pct(tax_amount, profit_before_tax),
        "net_profit":         net_profit,
        "net_margin_pct":     _pct(net_profit, revenue),
    }


def build_ratios(pl):
    """Key financial ratios derived from the P&L."""
    rev = pl["revenue"]
    return {
        "Gross Margin %":          _fmt_pct(pl["gross_margin_pct"]),
        "Operating Margin %":      _fmt_pct(pl["operating_margin_pct"]),
        "Net Profit Margin %":     _fmt_pct(pl["net_margin_pct"]),
        "COGS as % of Revenue":    _fmt_pct(_pct(pl["cogs"], rev)),
        "OpEx as % of Revenue":    _fmt_pct(_pct(pl["opex"], rev)),
        "Effective Tax Rate %":    _fmt_pct(pl["effective_tax_rate_pct"]),
        "Interest Coverage (x)":   round(pl["ebit"] / pl["interest_expense"], 2)
                                   if pl["interest_expense"] else "N/A",
    }


def build_budget_vs_actuals(transactions, budget_rows, coa):
    """Compare actual spend/income vs budget per account per period."""
    actuals = defaultdict(lambda: defaultdict(float))
    for t in transactions:
        grp = _account_group(coa, t["account_code"])
        # income groups: credit is positive; expense groups: debit is positive
        if grp in {"income", "other_income"}:
            actuals[t["period"]][t["account_code"]] += t["credit"] - t["debit"]
        else:
            actuals[t["period"]][t["account_code"]] += t["debit"] - t["credit"]

    results = []
    for b in budget_rows:
        actual = actuals[b["period"]].get(b["account_code"], 0)
        variance = actual - b["budget"]
        results.append({
            "period":       b["period"],
            "account_code": b["account_code"],
            "account_name": b["account_name"],
            "budget":       b["budget"],
            "actual":       actual,
            "variance":     variance,
            "variance_pct": _pct(variance, b["budget"]) if b["budget"] else None,
        })
    return results


def build_cash_flow(transactions, coa, pl, periods=None):
    """Build indirect-method Cash Flow statement."""
    if periods:
        transactions = [t for t in transactions if t["period"] in periods]

    def group_sum(groups):
        total = 0
        for t in transactions:
            g = _account_group(coa, t["account_code"])
            if g in groups:
                total += t["debit"] - t["credit"]
        return total

    # Operating: start from net income + add back non-cash items
    operating = pl["net_profit"] + pl["depreciation"]
    # Changes in working capital (AR increases = cash out; AP increases = cash in)
    ar_change = -group_sum({"current_assets"})
    ap_change =  group_sum({"current_liabilities"})
    cash_from_operations = operating + ar_change + ap_change

    cash_from_investing  = -group_sum({"fixed_assets"})
    cash_from_financing  =  group_sum({"equity", "long_term_liabilities"})

    return {
        "net_income":              pl["net_profit"],
        "add_depreciation":        pl["depreciation"],
        "working_capital_change":  ar_change + ap_change,
        "cash_from_operations":    cash_from_operations,
        "cash_from_investing":     cash_from_investing,
        "cash_from_financing":     cash_from_financing,
        "net_cash_change":         cash_from_operations + cash_from_investing + cash_from_financing,
    }


def load_opening_balances(csv_path):
    rows = []
    with open(csv_path) as f:
        for row in csv.DictReader(f):
            rows.append({
                "account_code": row["account_code"].strip(),
                "account_name": row["account_name"].strip(),
                "debit":  float(row.get("debit", 0) or 0),
                "credit": float(row.get("credit", 0) or 0),
            })
    return rows


def build_balance_sheet(transactions, opening_balances, coa, periods=None):
    """Build Balance Sheet: Assets = Liabilities + Equity."""
    if periods:
        transactions = [t for t in transactions if t["period"] in periods]

    # Aggregate movements from transactions
    movements = defaultdict(lambda: {"debit": 0.0, "credit": 0.0})
    for t in transactions:
        movements[t["account_code"]]["debit"]  += t["debit"]
        movements[t["account_code"]]["credit"] += t["credit"]

    # Merge opening balances + movements
    all_codes = set(r["account_code"] for r in opening_balances) | set(movements.keys())

    opening = {r["account_code"]: r for r in opening_balances}

    def closing_balance(code, group):
        """Return signed closing balance: positive = normal balance direction."""
        o_dr = opening.get(code, {}).get("debit",  0)
        o_cr = opening.get(code, {}).get("credit", 0)
        m_dr = movements[code]["debit"]
        m_cr = movements[code]["credit"]

        coa_grp = coa.get(group, {})
        normal  = coa_grp.get("normal_balance", "debit")

        net_debit  = (o_dr + m_dr) - (o_cr + m_cr)
        return net_debit if normal == "debit" else -net_debit

    def section_total(group):
        total = 0
        for code in all_codes:
            if _account_group(coa, code) == group:
                total += closing_balance(code, group)
        return total

    current_assets     = section_total("current_assets")
    fixed_assets       = section_total("fixed_assets")
    total_assets       = current_assets + fixed_assets

    current_liab       = section_total("current_liabilities")
    long_term_liab     = section_total("long_term_liabilities")
    total_liabilities  = current_liab + long_term_liab

    equity             = section_total("equity")
    total_equity       = equity
    total_liab_equity  = total_liabilities + total_equity

    return {
        "current_assets":       current_assets,
        "fixed_assets":         fixed_assets,
        "total_assets":         total_assets,
        "current_liabilities":  current_liab,
        "long_term_liabilities":long_term_liab,
        "total_liabilities":    total_liabilities,
        "equity":               equity,
        "total_equity":         total_equity,
        "total_liab_equity":    total_liab_equity,
        "balanced":             abs(total_assets - total_liab_equity) < 0.01,
        "difference":           round(total_assets - total_liab_equity, 2),
    }


def build_trial_balance(transactions, opening_balances, coa):
    """Produce a trial balance: list every account with total debits and credits."""
    movements = defaultdict(lambda: {"debit": 0.0, "credit": 0.0, "name": ""})
    for t in transactions:
        movements[t["account_code"]]["debit"]  += t["debit"]
        movements[t["account_code"]]["credit"] += t["credit"]
        if not movements[t["account_code"]]["name"]:
            movements[t["account_code"]]["name"] = t["account_name"]

    opening = {r["account_code"]: r for r in opening_balances}

    all_codes = sorted(set(list(opening.keys()) + list(movements.keys())))
    rows = []
    total_dr = total_cr = 0
    for code in all_codes:
        o = opening.get(code, {})
        m = movements.get(code, {"debit": 0, "credit": 0, "name": ""})
        name = o.get("account_name", m["name"])
        dr = (o.get("debit", 0) + m["debit"])
        cr = (o.get("credit", 0) + m["credit"])
        total_dr += dr
        total_cr += cr
        rows.append({"code": code, "name": name, "debit": dr, "credit": cr,
                     "group": _account_group(coa, code)})

    return {
        "rows":      rows,
        "total_debit":  round(total_dr, 2),
        "total_credit": round(total_cr, 2),
        "balanced":  abs(total_dr - total_cr) < 0.01,
    }


def build_bank_reconciliation(csv_path):
    """Compare bank statement vs books to find unmatched items."""
    bank_only = []
    books_only = []

    with open(csv_path) as f:
        for row in csv.DictReader(f):
            item = {
                "date":        row.get("date", ""),
                "description": row.get("description", ""),
                "amount":      float(row.get("amount", 0) or 0),
                "matched":     row.get("matched", "no").lower().strip() == "yes",
                "source":      row.get("source", "").lower().strip(),
            }
            if not item["matched"]:
                if item["source"] == "bank_statement":
                    bank_only.append(item)
                else:
                    books_only.append(item)

    return {
        "unmatched_bank_items":  bank_only,
        "unmatched_books_items": books_only,
        "bank_only_total":   sum(i["amount"] for i in bank_only),
        "books_only_total":  sum(i["amount"] for i in books_only),
        "reconciled":        not bank_only and not books_only,
    }


# ── helpers ────────────────────────────────────────────────────────────────────

def _bracketed_tax(income, brackets):
    tax = 0
    for b in brackets:
        lo   = b["from"]
        hi   = b["to"] if b["to"] else float("inf")
        rate = b["rate"]
        if income > lo:
            tax += (min(income, hi) - lo) * rate
    return tax


def _pct(num, denom):
    if not denom:
        return None
    return round((num / denom) * 100, 2)


def _fmt_pct(val):
    return f"{val}%" if val is not None else "N/A"
