"""CLI: build the Stage 2 context pack (rising/falling themes + grounding
examples) and write it as a prompt to data/idea_prompt.md.

No LLM API call here — this just assembles the grounded context. Generation
itself is done by whichever Claude session (subscription-based, e.g. Claude
Code) reads the prompt — paste it into a chat, or have the agent read
data/idea_prompt.md directly.

Usage:
    python scripts/build_idea_context.py
    python scripts/build_idea_context.py --recent 4 --baseline 8 --top-n 12 --num-ideas 8
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from yc_mind.scrape import load_companies  # noqa: E402
from yc_mind import trends, keywords, idea_gen  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Stage 2 idea-gen prompt.")
    parser.add_argument("--in", dest="infile", default="data/companies.jsonl")
    parser.add_argument("--out", default="data/idea_prompt.md")
    parser.add_argument("--recent", type=int, default=4)
    parser.add_argument("--baseline", type=int, default=8)
    parser.add_argument("--min-size", type=int, default=30, dest="min_size")
    parser.add_argument("--min-doc-freq", type=int, default=8, dest="min_doc_freq")
    parser.add_argument("--top-n", type=int, default=12, dest="top_n",
                        help="How many rising / falling themes to include.")
    parser.add_argument("--num-ideas", type=int, default=8, dest="num_ideas",
                        help="How many ideas to ask for in the prompt.")
    parser.add_argument("--min-recent-share", type=float, default=0.01,
                        dest="min_recent_share")
    args = parser.parse_args()

    companies = load_companies(args.infile)
    print(f"Loaded {len(companies)} companies from {args.infile}.")

    keywords.attach_keywords(companies, use_description=False, min_doc_freq=args.min_doc_freq)

    share = trends.share_by_batch(companies, "keywords", min_size=args.min_size)
    mv = trends.movers(
        share, recent=args.recent, baseline=args.baseline,
        min_recent_share=args.min_recent_share,
    )

    sizes = trends.batch_sizes(companies, min_size=args.min_size)
    recent_batches = list(sizes)[-args.recent:]
    recent_label = ", ".join(recent_batches)

    rising, falling = idea_gen.build_theme_examples(
        companies, mv, recent_batches, top_n=args.top_n
    )
    prompt = idea_gen.build_prompt(
        rising, falling,
        recent_label=recent_label,
        baseline_n=args.baseline,
        num_ideas=args.num_ideas,
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(prompt, encoding="utf-8")
    print(f"Recent batches: {recent_label}")
    print(f"Rising themes: {len(rising)}, falling themes: {len(falling)}")
    print(f"Wrote {out_path}")
    print("\nNext: paste this prompt into a Claude chat (or have Claude Code read it) "
          "to generate the ideas — no API key needed.")


if __name__ == "__main__":
    main()
