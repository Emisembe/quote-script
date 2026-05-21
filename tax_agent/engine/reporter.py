from pathlib import Path
from datetime import datetime

BASE = Path(__file__).parent.parent


def _currency(val, symbol="$"):
    if val is None:
        return "—"
    color = "color:#c0392b;" if val < 0 else ""
    fmt = f"{symbol}{abs(val):,.2f}"
    neg = "(" + fmt + ")" if val < 0 else fmt
    return f'<span style="{color}">{neg}</span>'


def _row(label, value, symbol, bold=False, indent=0, separator=False):
    pad = indent * 20
    style = "font-weight:700;" if bold else ""
    sep = "border-top:2px solid #2c3e50;" if separator else ""
    return (
        f'<tr style="{sep}">'
        f'<td style="padding:6px 8px;padding-left:{16+pad}px;{style}">{label}</td>'
        f'<td style="padding:6px 8px;text-align:right;{style}">{_currency(value, symbol)}</td>'
        f'</tr>'
    )


def _ratio_row(label, value):
    return (
        f'<tr>'
        f'<td style="padding:6px 8px;">{label}</td>'
        f'<td style="padding:6px 8px;text-align:right;font-weight:600;">{value}</td>'
        f'</tr>'
    )


def _section_header(title):
    return (
        f'<tr style="background:#2c3e50;color:#fff;">'
        f'<td colspan="2" style="padding:8px 16px;font-weight:700;font-size:13px;">{title}</td>'
        f'</tr>'
    )


def _bva_row(item, symbol):
    variance = item["variance"]
    var_color = "#27ae60" if variance >= 0 else "#c0392b"
    pct = f'{item["variance_pct"]:.1f}%' if item["variance_pct"] is not None else "—"
    return (
        f'<tr>'
        f'<td style="padding:6px 8px;">{item["period"]}</td>'
        f'<td style="padding:6px 8px;">{item["account_code"]}</td>'
        f'<td style="padding:6px 8px;">{item["account_name"]}</td>'
        f'<td style="padding:6px 8px;text-align:right;">{_currency(item["budget"], symbol)}</td>'
        f'<td style="padding:6px 8px;text-align:right;">{_currency(item["actual"], symbol)}</td>'
        f'<td style="padding:6px 8px;text-align:right;color:{var_color};font-weight:600;">'
        f'{_currency(variance, symbol)}</td>'
        f'<td style="padding:6px 8px;text-align:right;color:{var_color};">{pct}</td>'
        f'</tr>'
    )


def _bs_row(label, value, symbol, bold=False, indent=0, separator=False):
    pad   = indent * 20
    style = "font-weight:700;" if bold else ""
    sep   = "border-top:2px solid #2c3e50;" if separator else ""
    return (
        f'<tr style="{sep}">'
        f'<td style="padding:6px 8px;padding-left:{16+pad}px;{style}">{label}</td>'
        f'<td style="padding:6px 8px;text-align:right;{style}">{_currency(value, symbol)}</td>'
        f'</tr>'
    )


def generate_html_report(pl, ratios, cash_flow, bva, config, output_path=None, periods=None,
                         balance_sheet=None, trial_balance=None, bank_rec=None):
    sym   = config["currency_symbol"]
    name  = config["country_name"]
    label = config["labels"]
    now   = datetime.now().strftime("%Y-%m-%d %H:%M")
    period_str = ", ".join(sorted(set(periods))) if periods else "All periods"

    bk          = config.get("bookkeeping", {})
    entity_code = bk.get("entity_type", "")
    entity_info = config.get("entity_tax_treatment", {}).get(entity_code, {})
    entity_label = entity_info.get("label", entity_code.upper())
    acct_method  = bk.get("accounting_method", "accrual").capitalize()
    tax_method   = entity_info.get("tax_method", "").replace("_", " ").title()
    double_tax   = "Yes (Double Taxation)" if entity_info.get("double_taxation") else "No"

    pl_rows = "".join([
        _section_header("INCOME"),
        _row(label["revenue"],           pl["revenue"],           sym),
        _row(label.get("other_income","Other Income"), pl["other_income"], sym),
        _row("Total Income",              pl["total_income"],      sym, bold=True, separator=True),
        _section_header("COST OF SALES"),
        _row(label["cost_of_sales"],      pl["cogs"],              sym),
        _row(label["gross_profit"],       pl["gross_profit"],      sym, bold=True, separator=True),
        _row(f'  Gross Margin',           None, sym),
        f'<tr><td style="padding:4px 8px 8px 28px;color:#7f8c8d;font-size:12px;">'
        f'Gross Margin: <strong>{pl["gross_margin_pct"]}%</strong></td><td></td></tr>',
        _section_header("OPERATING EXPENSES"),
        _row(label["operating_expenses"], pl["opex"],              sym),
        _row(label["depreciation"],       pl["depreciation"],      sym),
        _row(label["ebit"],               pl["ebit"],              sym, bold=True, separator=True),
        _section_header("BELOW THE LINE"),
        _row(label.get("other_income","Other Income"), pl["other_income"], sym),
        _row(label["interest_expense"],   pl["interest_expense"],  sym),
        _row(label["profit_before_tax"],  pl["profit_before_tax"], sym, bold=True, separator=True),
        _section_header("TAX"),
        _row(label["income_tax"],         pl["tax_amount"],        sym),
        _row(label["net_profit"],         pl["net_profit"],        sym, bold=True, separator=True),
        f'<tr><td style="padding:4px 8px 8px 28px;color:#7f8c8d;font-size:12px;">'
        f'Net Margin: <strong>{pl["net_margin_pct"]}%</strong></td><td></td></tr>',
    ])

    ratio_rows = "".join(_ratio_row(k, v) for k, v in ratios.items())

    cf = cash_flow
    cf_rows = "".join([
        _section_header("OPERATING ACTIVITIES"),
        _row("Net Income",                cf["net_income"],            sym),
        _row("Add: Depreciation",         cf["add_depreciation"],      sym),
        _row("Working Capital Changes",   cf["working_capital_change"],sym),
        _row("Cash from Operations",      cf["cash_from_operations"],  sym, bold=True, separator=True),
        _section_header("INVESTING ACTIVITIES"),
        _row("Cash from Investing",       cf["cash_from_investing"],   sym, bold=True),
        _section_header("FINANCING ACTIVITIES"),
        _row("Cash from Financing",       cf["cash_from_financing"],   sym, bold=True),
        _section_header(""),
        _row("Net Change in Cash",        cf["net_cash_change"],       sym, bold=True, separator=True),
    ])

    # ── Balance Sheet ──────────────────────────────────────────────────────────
    if balance_sheet:
        bs = balance_sheet
        balanced_tag = (
            '<span style="color:#27ae60;font-weight:700;">BALANCED</span>'
            if bs["balanced"] else
            f'<span style="color:#c0392b;font-weight:700;">OUT BY {sym}{abs(bs["difference"]):,.2f}</span>'
        )
        bs_rows = "".join([
            _section_header("ASSETS"),
            _bs_row("Current Assets",        bs["current_assets"],    sym, indent=1),
            _bs_row("Fixed Assets",          bs["fixed_assets"],      sym, indent=1),
            _bs_row("TOTAL ASSETS",          bs["total_assets"],      sym, bold=True, separator=True),
            _section_header("LIABILITIES"),
            _bs_row("Current Liabilities",   bs["current_liabilities"],   sym, indent=1),
            _bs_row("Long Term Liabilities", bs["long_term_liabilities"], sym, indent=1),
            _bs_row("TOTAL LIABILITIES",     bs["total_liabilities"],     sym, bold=True, separator=True),
            _section_header("OWNERS EQUITY"),
            _bs_row("Equity",                bs["equity"],            sym, indent=1),
            _bs_row("TOTAL EQUITY",          bs["total_equity"],      sym, bold=True, separator=True),
            _section_header(""),
            _bs_row("TOTAL LIABILITIES + EQUITY", bs["total_liab_equity"], sym, bold=True),
            f'<tr><td colspan="2" style="padding:8px 16px;text-align:center;">{balanced_tag}</td></tr>',
        ])
        bs_html = f'<div class="card" style="margin-top:20px;"><h2>BALANCE SHEET (Assets = Liabilities + Equity)</h2><table>{bs_rows}</table></div>'
    else:
        bs_html = ""

    # ── Trial Balance ──────────────────────────────────────────────────────────
    if trial_balance:
        tb = trial_balance
        tb_rows = "".join(
            f'<tr>'
            f'<td style="padding:5px 8px;">{r["code"]}</td>'
            f'<td style="padding:5px 8px;">{r["name"]}</td>'
            f'<td style="padding:5px 8px;color:#7f8c8d;font-size:11px;">{r["group"]}</td>'
            f'<td style="padding:5px 8px;text-align:right;">{_currency(r["debit"], sym)}</td>'
            f'<td style="padding:5px 8px;text-align:right;">{_currency(r["credit"], sym)}</td>'
            f'</tr>'
            for r in tb["rows"]
        )
        bal_color = "#27ae60" if tb["balanced"] else "#c0392b"
        tb_html = f"""
        <div class="card" style="margin-top:20px;">
          <h2>TRIAL BALANCE</h2>
          <table>
            <thead class="bva-table">
              <tr><th>Code</th><th>Account</th><th>Group</th>
                  <th style="text-align:right;">Debit</th>
                  <th style="text-align:right;">Credit</th></tr>
            </thead>
            <tbody>{tb_rows}</tbody>
            <tfoot>
              <tr style="background:#2c3e50;color:#fff;font-weight:700;">
                <td colspan="3" style="padding:8px 16px;">TOTALS</td>
                <td style="padding:8px;text-align:right;">{_currency(tb["total_debit"], sym)}</td>
                <td style="padding:8px;text-align:right;">{_currency(tb["total_credit"], sym)}</td>
              </tr>
              <tr><td colspan="5" style="padding:8px;text-align:center;color:{bal_color};font-weight:700;">
                {"TRIAL BALANCE IS BALANCED" if tb["balanced"] else "WARNING: TRIAL BALANCE DOES NOT BALANCE"}
              </td></tr>
            </tfoot>
          </table>
        </div>"""
    else:
        tb_html = ""

    # ── Bank Reconciliation ────────────────────────────────────────────────────
    if bank_rec:
        rec_status = (
            '<span style="color:#27ae60;font-weight:700;">FULLY RECONCILED</span>'
            if bank_rec["reconciled"] else
            '<span style="color:#e67e22;font-weight:700;">OUTSTANDING ITEMS — REVIEW REQUIRED</span>'
        )
        def rec_rows(items, label):
            if not items:
                return f'<tr><td colspan="3" style="padding:8px;color:#27ae60;">No unmatched {label} items</td></tr>'
            return "".join(
                f'<tr><td style="padding:5px 8px;">{i["date"]}</td>'
                f'<td style="padding:5px 8px;">{i["description"]}</td>'
                f'<td style="padding:5px 8px;text-align:right;">{_currency(i["amount"], sym)}</td></tr>'
                for i in items
            )
        bank_rec_html = f"""
        <div class="card" style="margin-top:20px;">
          <h2>BANK RECONCILIATION</h2>
          <div style="padding:12px 16px;">{rec_status}</div>
          <table>
            <thead class="bva-table">
              <tr><th colspan="3">Items in Bank Statement NOT in Books</th></tr>
              <tr><th>Date</th><th>Description</th><th style="text-align:right;">Amount</th></tr>
            </thead>
            <tbody>{rec_rows(bank_rec["unmatched_bank_items"], "bank")}</tbody>
          </table>
          <table style="margin-top:12px;">
            <thead class="bva-table">
              <tr><th colspan="3">Items in Books NOT in Bank Statement</th></tr>
              <tr><th>Date</th><th>Description</th><th style="text-align:right;">Amount</th></tr>
            </thead>
            <tbody>{rec_rows(bank_rec["unmatched_books_items"], "books")}</tbody>
          </table>
        </div>"""
    else:
        bank_rec_html = ""

    bva_rows = "".join(_bva_row(item, sym) for item in bva) if bva else (
        '<tr><td colspan="7" style="padding:12px;color:#7f8c8d;text-align:center;">'
        'No budget data loaded</td></tr>'
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Financial Report — {name}</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ font-family:'Segoe UI',Arial,sans-serif; background:#f4f6f9; color:#2c3e50; font-size:14px; }}
  .container {{ max-width:1100px; margin:0 auto; padding:24px; }}
  .header {{ background:#2c3e50; color:#fff; padding:24px 32px; border-radius:8px 8px 0 0; }}
  .header h1 {{ font-size:22px; margin-bottom:4px; }}
  .header p {{ color:#bdc3c7; font-size:13px; }}
  .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }}
  .grid-3 {{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:20px; }}
  .card {{ background:#fff; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,.1); overflow:hidden; }}
  .card h2 {{ background:#34495e; color:#fff; padding:10px 16px; font-size:14px; letter-spacing:.5px; }}
  table {{ width:100%; border-collapse:collapse; }}
  tr:nth-child(even) {{ background:#f9f9f9; }}
  .bva-table th {{ background:#34495e; color:#fff; padding:8px; text-align:left; font-size:12px; }}
  .kpi-grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; }}
  .kpi {{ background:#fff; border-radius:6px; padding:16px; text-align:center;
           box-shadow:0 1px 4px rgba(0,0,0,.1); }}
  .kpi .val {{ font-size:26px; font-weight:700; color:#2980b9; }}
  .kpi .lbl {{ font-size:11px; color:#7f8c8d; margin-top:4px; text-transform:uppercase; }}
  .footer {{ text-align:center; color:#95a5a6; font-size:11px; margin-top:24px; padding:12px; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Financial Report — {name}</h1>
    <p>Period: {period_str} &nbsp;|&nbsp; Currency: {config["currency_code"]} ({sym}) &nbsp;|&nbsp; Generated: {now}</p>
    <p style="margin-top:6px;font-size:12px;color:#bdc3c7;">
      Entity: <strong style="color:#ecf0f1;">{entity_label}</strong> &nbsp;|&nbsp;
      Accounting: <strong style="color:#ecf0f1;">{acct_method}</strong> &nbsp;|&nbsp;
      Tax Method: <strong style="color:#ecf0f1;">{tax_method}</strong> &nbsp;|&nbsp;
      Double Taxation: <strong style="color:#ecf0f1;">{double_tax}</strong>
    </p>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="val">{sym}{pl['revenue']:,.0f}</div><div class="lbl">Total Revenue</div></div>
    <div class="kpi"><div class="val">{pl['gross_margin_pct']}%</div><div class="lbl">Gross Margin</div></div>
    <div class="kpi"><div class="val">{pl['net_margin_pct']}%</div><div class="lbl">Net Margin</div></div>
    <div class="kpi"><div class="val">{sym}{pl['gross_profit']:,.0f}</div><div class="lbl">Gross Profit</div></div>
    <div class="kpi"><div class="val">{sym}{pl['ebit']:,.0f}</div><div class="lbl">EBIT</div></div>
    <div class="kpi"><div class="val">{sym}{pl['net_profit']:,.0f}</div><div class="lbl">Net Profit</div></div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>PROFIT & LOSS STATEMENT</h2>
      <table>{pl_rows}</table>
    </div>
    <div>
      <div class="card">
        <h2>KEY FINANCIAL RATIOS</h2>
        <table>{ratio_rows}</table>
      </div>
      <div class="card" style="margin-top:20px;">
        <h2>CASH FLOW STATEMENT</h2>
        <table>{cf_rows}</table>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:20px;">
    <h2>BUDGET VS ACTUALS</h2>
    <table>
      <thead class="bva-table">
        <tr>
          <th>Period</th><th>Code</th><th>Account</th>
          <th style="text-align:right;">Budget</th>
          <th style="text-align:right;">Actual</th>
          <th style="text-align:right;">Variance</th>
          <th style="text-align:right;">Var %</th>
        </tr>
      </thead>
      <tbody>{bva_rows}</tbody>
    </table>
  </div>

  {bs_html}
  {tb_html}
  {bank_rec_html}

  <div class="footer">
    Offline Accounting Tax Agent &mdash; data is processed locally, no data leaves your machine.
    Update <code>config/countries/template.json</code> to change tax rates, currency &amp; entity type.
  </div>
</div>
</body>
</html>"""

    if output_path:
        Path(output_path).write_text(html, encoding="utf-8")
        return output_path
    return html
