#!/usr/bin/env python3
"""
Offline Accounting Tax Agent & AI Tax Consultant
Usage:
  python main.py report   --data data/sample_transactions.csv --country ke
  python main.py chat     --data data/sample_transactions.csv --country ke --provider rules
  python main.py chat     --data data/sample_transactions.csv --country de --provider claude
  python main.py chat     --data data/sample_transactions.csv --country ke --provider ollama
  python main.py trial-balance --data data/sample_transactions.csv --opening data/opening_balances.csv
  python main.py list-accounts
  python main.py list-countries

Providers:
  rules   — Offline, no AI, rule-based answers (zero setup)
  ollama  — Offline AI via local Ollama (install ollama + pull a model)
  claude  — Online AI via Claude API (set ANTHROPIC_API_KEY)
"""

import argparse
import json
import sys
import os
from pathlib import Path

BASE = Path(__file__).parent
sys.path.insert(0, str(BASE))

from engine.calculator import (
    load_config, load_coa, load_transactions, load_budget,
    load_opening_balances, build_pl, build_ratios, build_budget_vs_actuals,
    build_cash_flow, build_balance_sheet, build_trial_balance,
    build_bank_reconciliation,
)
from engine.reporter import generate_html_report
from engine.consultant import (
    build_financial_context, build_tax_context, ConsultantSession
)


def cmd_report(args):
    config  = load_config(args.country)
    coa     = load_coa()
    sym     = config["currency_symbol"]
    periods = args.period or None

    transactions = load_transactions(args.data)

    budget_rows = load_budget(args.budget) if args.budget else []
    opening     = load_opening_balances(args.opening) if args.opening else []

    pl         = build_pl(transactions, coa, config, periods)
    ratios     = build_ratios(pl)
    cash_flow  = build_cash_flow(transactions, coa, pl, periods)
    bva        = build_budget_vs_actuals(transactions, budget_rows, coa) if budget_rows else []
    bs         = build_balance_sheet(transactions, opening, coa, periods) if opening else None
    tb         = build_trial_balance(transactions, opening, coa) if opening else None
    bank_rec   = build_bank_reconciliation(args.bank_rec) if args.bank_rec else None

    output = args.output or str(BASE / "reports" / "report.html")
    Path(output).parent.mkdir(parents=True, exist_ok=True)

    generate_html_report(
        pl, ratios, cash_flow, bva, config,
        output_path=output,
        periods=periods,
        balance_sheet=bs,
        trial_balance=tb,
        bank_rec=bank_rec,
    )

    print(f"\nReport generated: {output}")
    print(f"\n{'='*50}")
    print(f"  FINANCIAL SUMMARY — {config['country_name']}")
    print(f"  Periods: {', '.join(sorted(set(periods))) if periods else 'All'}")
    print(f"{'='*50}")
    print(f"  Revenue:           {sym}{pl['revenue']:>12,.2f}")
    print(f"  Gross Profit:      {sym}{pl['gross_profit']:>12,.2f}  ({pl['gross_margin_pct']}%)")
    print(f"  EBIT:              {sym}{pl['ebit']:>12,.2f}  ({pl['operating_margin_pct']}%)")
    print(f"  Net Profit:        {sym}{pl['net_profit']:>12,.2f}  ({pl['net_margin_pct']}%)")
    print(f"  Tax:               {sym}{pl['tax_amount']:>12,.2f}")
    if bs:
        print(f"\n  Total Assets:      {sym}{bs['total_assets']:>12,.2f}")
        print(f"  Total Liabilities: {sym}{bs['total_liabilities']:>12,.2f}")
        print(f"  Equity:            {sym}{bs['equity']:>12,.2f}")
        bs_status = "BALANCED" if bs["balanced"] else f"OUT BY {sym}{abs(bs['difference']):,.2f}"
        print(f"  Balance Sheet:     {bs_status}")
    if bank_rec:
        print(f"\n  Bank Rec:          {'RECONCILED' if bank_rec['reconciled'] else 'OUTSTANDING ITEMS'}")
    print(f"{'='*50}\n")


def cmd_trial_balance(args):
    config = load_config(args.country)
    coa    = load_coa()
    sym    = config["currency_symbol"]

    transactions = load_transactions(args.data)
    opening      = load_opening_balances(args.opening) if args.opening else []
    tb           = build_trial_balance(transactions, opening, coa)

    print(f"\n{'='*70}")
    print(f"  TRIAL BALANCE — {config['country_name']}")
    print(f"{'='*70}")
    print(f"  {'Code':<8} {'Account':<35} {'Debit':>12} {'Credit':>12}")
    print(f"  {'-'*65}")
    for r in tb["rows"]:
        print(f"  {r['code']:<8} {r['name']:<35} {sym}{r['debit']:>11,.2f} {sym}{r['credit']:>11,.2f}")
    print(f"  {'='*65}")
    print(f"  {'TOTALS':<44} {sym}{tb['total_debit']:>11,.2f} {sym}{tb['total_credit']:>11,.2f}")
    print(f"\n  Status: {'BALANCED' if tb['balanced'] else 'DOES NOT BALANCE'}\n")


def cmd_chat(args):
    config  = load_config(args.country)
    coa     = load_coa()
    periods = args.period or None

    transactions = load_transactions(args.data)
    budget_rows  = load_budget(args.budget) if args.budget else []
    opening      = load_opening_balances(args.opening) if args.opening else []

    pl        = build_pl(transactions, coa, config, periods)
    ratios    = build_ratios(pl)
    cash_flow = build_cash_flow(transactions, coa, pl, periods)
    bva       = build_budget_vs_actuals(transactions, budget_rows, coa) if budget_rows else []
    bs        = build_balance_sheet(transactions, opening, coa, periods) if opening else None

    fin_ctx = build_financial_context(pl, ratios, bs, cash_flow, bva, periods)
    tax_ctx = build_tax_context(config)

    provider = args.provider
    session  = ConsultantSession(
        financial_context=fin_ctx,
        tax_context=tax_ctx,
        provider=provider,
        model=args.model,
        pl=pl,
        ratios=ratios,
        config=config,
    )

    provider_labels = {
        "claude":  "Claude AI (Anthropic API)",
        "ollama":  f"Ollama local model ({args.model or 'llama3.2'})",
        "rules":   "Rule-based (offline, no AI)",
    }
    sym = config["currency_symbol"]

    print(f"\n{'='*60}")
    print(f"  OFFLINE TAX CONSULTANT — {config['country_name']}")
    print(f"  Provider: {provider_labels.get(provider, provider)}")
    print(f"  Data: {args.data}")
    print(f"  Revenue: {sym}{pl['revenue']:,.2f}  |  Net Profit: {sym}{pl['net_profit']:,.2f}")
    print(f"{'='*60}")
    print("  Type your question. Commands: 'quit' to exit, 'reset' to start fresh,")
    print("  'context' to see what data the consultant has, 'summary' for financials.")
    print(f"{'='*60}\n")

    # Primer for non-rules providers
    if provider != "rules":
        print("  [Connecting to AI consultant...]")
        try:
            first_response = session.ask(
                "Briefly introduce yourself as my tax consultant and give me a 3-point "
                "summary of my financial position and the most important tax issue I should "
                "address right now."
            )
            print(f"\nConsultant: {first_response}\n")
        except RuntimeError as e:
            print(f"\n  ERROR: {e}\n")
            print("  Falling back to rule-based mode...\n")
            session.provider = "rules"

    while True:
        try:
            question = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nSession ended.")
            break

        if not question:
            continue
        if question.lower() in ("quit", "exit", "bye"):
            print("Goodbye.")
            break
        if question.lower() == "reset":
            session.reset()
            print("Session reset.\n")
            continue
        if question.lower() == "context":
            print(fin_ctx)
            print(tax_ctx)
            continue
        if question.lower() == "summary":
            print(fin_ctx)
            continue

        try:
            answer = session.ask(question)
            print(f"\nConsultant: {answer}\n")
        except RuntimeError as e:
            print(f"\n  ERROR: {e}\n")


def cmd_list_countries(args):
    country_dir = BASE / "config" / "countries"
    print(f"\n{'='*50}")
    print("  AVAILABLE COUNTRY CONFIGS")
    print(f"{'='*50}")
    for f in sorted(country_dir.glob("*.json")):
        try:
            with open(f) as fh:
                cfg = json.load(fh)
            print(f"  {f.stem:<12}  {cfg.get('country_name',''):<20}  {cfg.get('currency_code','')} ({cfg.get('currency_symbol','')})")
        except Exception:
            print(f"  {f.stem}")
    print(f"\n  Usage: python main.py chat --data mydata.csv --country ke\n")


def cmd_list_accounts(args):
    coa = load_coa()
    print(f"\n{'='*60}")
    print("  CHART OF ACCOUNTS")
    print(f"{'='*60}")
    for group, data in coa.items():
        print(f"\n  [{data['label'].upper()}]  (range {data['range']})")
        for code, name in data["accounts"].items():
            print(f"    {code}  {name}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Offline Accounting Tax Agent — works for any country",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command")

    # ── report ──────────────────────────────────────────────────────────────
    rp = sub.add_parser("report", help="Generate full financial report (P&L, BS, CF, BvA)")
    rp.add_argument("--data",     required=True, help="Path to transactions CSV")
    rp.add_argument("--country",  default="template", help="Country config code (default: template)")
    rp.add_argument("--budget",   help="Path to budget CSV (optional)")
    rp.add_argument("--opening",  help="Path to opening balances CSV (for Balance Sheet)")
    rp.add_argument("--bank-rec", dest="bank_rec", help="Path to bank reconciliation CSV")
    rp.add_argument("--period",   action="append", help="Filter to period(s) e.g. 2024-01 (repeatable)")
    rp.add_argument("--output",   help="Output HTML path (default: reports/report.html)")

    # ── trial-balance ────────────────────────────────────────────────────────
    tb = sub.add_parser("trial-balance", help="Print trial balance to console")
    tb.add_argument("--data",    required=True, help="Path to transactions CSV")
    tb.add_argument("--country", default="template")
    tb.add_argument("--opening", help="Path to opening balances CSV")

    # ── list-accounts ────────────────────────────────────────────────────────
    la = sub.add_parser("list-accounts", help="Print the chart of accounts")

    # ── list-countries ───────────────────────────────────────────────────────
    lc = sub.add_parser("list-countries", help="List available country configs")

    # ── chat ─────────────────────────────────────────────────────────────────
    ch = sub.add_parser("chat", help="Interactive AI tax consultant session")
    ch.add_argument("--data",     required=True, help="Path to transactions CSV")
    ch.add_argument("--country",  default="template", help="Country code (ke, de, template, ...)")
    ch.add_argument("--budget",   help="Path to budget CSV (optional)")
    ch.add_argument("--opening",  help="Path to opening balances CSV (optional)")
    ch.add_argument("--period",   action="append", help="Filter to period(s) e.g. 2024-01")
    ch.add_argument("--provider", default="rules",
                    choices=["rules", "claude", "ollama"],
                    help="AI provider: rules (offline), claude (API), ollama (local LLM)")
    ch.add_argument("--model",    help="Model override (e.g. llama3.2, claude-opus-4-7)")

    args = parser.parse_args()

    if args.command == "report":
        cmd_report(args)
    elif args.command == "trial-balance":
        cmd_trial_balance(args)
    elif args.command == "list-accounts":
        cmd_list_accounts(args)
    elif args.command == "list-countries":
        cmd_list_countries(args)
    elif args.command == "chat":
        cmd_chat(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
