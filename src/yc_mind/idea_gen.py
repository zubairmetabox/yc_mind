"""Stage 2: build the context pack + prompt for LLM-driven idea generation.

This module does not call any LLM itself for the default path — it assembles a
grounded context pack (rising/falling themes with real example companies) into
a single prompt. The prompt is written to a file the user can paste into any
Claude chat. `scripts/generate_ideas.py` additionally supports calling the
Claude API directly if ANTHROPIC_API_KEY is set, using the same prompt.
"""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .models import Company

EXAMPLES_PER_THEME = 4


@dataclass
class ThemeExample:
    theme: str
    baseline_share: float
    recent_share: float
    change: float
    examples: list[str]  # "Name — one_liner" for recent companies matching the theme


def _recent_examples(
    companies: list[Company], theme: str, recent_batches: set[str], limit: int
) -> list[str]:
    matches = [
        c for c in companies
        if c.batch in recent_batches and theme in (c.keywords or [])
    ]
    out = []
    for c in matches[:limit]:
        out.append(f"{c.name} — {c.one_liner}")
    return out


def build_theme_examples(
    companies: list[Company],
    movers: pd.DataFrame,
    recent_batches: list[str],
    *,
    top_n: int = 12,
    examples_per_theme: int = EXAMPLES_PER_THEME,
) -> tuple[list[ThemeExample], list[ThemeExample]]:
    """Return (rising, falling) ThemeExample lists, each grounded with real
    companies from the recent window so the LLM isn't generating from bare
    percentages."""
    recent_set = set(recent_batches)

    def build(rows: pd.DataFrame) -> list[ThemeExample]:
        out = []
        for theme, row in rows.iterrows():
            out.append(
                ThemeExample(
                    theme=theme,
                    baseline_share=row.baseline_share,
                    recent_share=row.recent_share,
                    change=row.change,
                    examples=_recent_examples(companies, theme, recent_set, examples_per_theme),
                )
            )
        return out

    rising = build(movers.head(top_n))
    falling = build(movers.tail(top_n).iloc[::-1])
    return rising, falling


PROMPT_TEMPLATE = """\
You are acting as a sharp YC partner reviewing funding trend data to spot the \
next fundable startup ideas. Below is real data from YC's public company \
directory: which problem-space themes (extracted from company one-liners/\
descriptions, NOT official YC tags) are rising or falling in the most recent \
batches ({recent_label}) compared to the {baseline_n}-batch period before them.

Each theme includes its share-of-batch change and real example companies \
already in that space, so you can see what's already been done and find the \
adjacent gap rather than re-pitching an existing company.

## Rising themes (recent vs. baseline share of companies)
{rising_block}

## Falling / cooling themes
{falling_block}

## Your task

Generate {num_ideas} specific, fundable startup ideas. For each idea:
1. **Name/concept** (one line)
2. **What it does** (2-3 sentences, concrete — not "AI for X")
3. **Why now** — tie explicitly to a rising theme above and explain the gap \
the existing example companies in that theme do NOT cover
4. **Target customer** — be specific (e.g. "mid-market logistics ops teams", \
not "businesses")
5. **Risk** — one sentence on the most likely reason this fails or doesn't get \
funded

Rules:
- Do not propose anything that duplicates an example company listed above — \
find the adjacent, uncovered angle.
- Prefer ideas that combine two rising themes over ideas that chase only one \
(YC increasingly funds intersections, not single trends).
- Skip generic infrastructure plays unless you can name the specific wedge use \
case and first customer.
- If a falling theme reveals an underserved niche (the few examples remaining \
are leaving a gap), you may use that — but say so explicitly.
"""


def _format_block(items: list[ThemeExample]) -> str:
    lines = []
    for t in items:
        lines.append(
            f"- **{t.theme}**: {t.baseline_share*100:.1f}% -> {t.recent_share*100:.1f}% "
            f"({t.change*100:+.1f} pts)"
        )
        for ex in t.examples:
            lines.append(f"    - {ex}")
        if not t.examples:
            lines.append("    - (no recent example companies surfaced)")
    return "\n".join(lines) if lines else "(none)"


def build_prompt(
    rising: list[ThemeExample],
    falling: list[ThemeExample],
    *,
    recent_label: str,
    baseline_n: int,
    num_ideas: int = 8,
) -> str:
    return PROMPT_TEMPLATE.format(
        recent_label=recent_label,
        baseline_n=baseline_n,
        rising_block=_format_block(rising),
        falling_block=_format_block(falling),
        num_ideas=num_ideas,
    )
