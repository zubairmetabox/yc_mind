"""Algolia client for the YC company directory.

The YC companies page (https://www.ycombinator.com/companies) is a React app
backed by an Algolia search index. The page embeds a *public, restricted*
Algolia key in a `window.AlgoliaOpts = {...}` blob. That key rotates (it carries
an embedded `validUntil` timestamp), so rather than hardcoding it we scrape the
current credentials from the page at runtime.

The directory has ~6k companies but Algolia caps offset pagination at 1,000 hits
per query, so callers slice by a facet (batch) to stay under the cap — see
`scrape.py`.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from urllib.parse import urlencode

import requests

YC_COMPANIES_URL = "https://www.ycombinator.com/companies"
INDEX = "YCCompany_production"
# Restricts results to the public company directory (same filter the site uses).
PUBLIC_TAG_FILTER = '["ycdc_public"]'

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
_ALGOLIA_OPTS_RE = re.compile(r"window\.AlgoliaOpts\s*=\s*(\{.*?\})\s*;", re.DOTALL)


@dataclass(frozen=True)
class AlgoliaCreds:
    app_id: str
    api_key: str

    @property
    def query_url(self) -> str:
        return f"https://{self.app_id.lower()}-dsn.algolia.net/1/indexes/{INDEX}/query"


def fetch_credentials(session: requests.Session | None = None) -> AlgoliaCreds:
    """Scrape the current Algolia app id + public key from the YC companies page."""
    sess = session or requests.Session()
    resp = sess.get(YC_COMPANIES_URL, headers={"User-Agent": _USER_AGENT}, timeout=30)
    resp.raise_for_status()
    match = _ALGOLIA_OPTS_RE.search(resp.text)
    if not match:
        raise RuntimeError(
            "Could not find window.AlgoliaOpts on the YC companies page. "
            "The page structure may have changed."
        )
    opts = json.loads(match.group(1))
    return AlgoliaCreds(app_id=opts["app"], api_key=opts["key"])


class AlgoliaClient:
    """Thin wrapper around the YC Algolia search index."""

    def __init__(self, creds: AlgoliaCreds | None = None, *, request_pause: float = 0.1):
        self.session = requests.Session()
        self.creds = creds or fetch_credentials(self.session)
        self.request_pause = request_pause

    def _headers(self) -> dict:
        return {
            "x-algolia-application-id": self.creds.app_id,
            "x-algolia-api-key": self.creds.api_key,
            "Content-Type": "application/json",
        }

    def query(
        self,
        *,
        page: int = 0,
        hits_per_page: int = 1000,
        facet_filters: list[str] | None = None,
        facets: list[str] | None = None,
        max_values_per_facet: int = 1000,
    ) -> dict:
        """Run one search query. Returns the raw Algolia response dict."""
        params = {
            "query": "",
            "tagFilters": PUBLIC_TAG_FILTER,
            "page": page,
            "hitsPerPage": hits_per_page,
        }
        if facet_filters:
            params["facetFilters"] = json.dumps(facet_filters)
        if facets:
            params["facets"] = json.dumps(facets)
            params["maxValuesPerFacet"] = max_values_per_facet

        body = {"params": urlencode(params)}
        resp = self.session.post(
            self.creds.query_url,
            headers=self._headers(),
            data=json.dumps(body),
            timeout=30,
        )
        resp.raise_for_status()
        if self.request_pause:
            time.sleep(self.request_pause)
        return resp.json()

    def facet_counts(self, facet: str) -> dict[str, int]:
        """Return {facet_value: count} for a single facet across the whole index."""
        resp = self.query(hits_per_page=0, facets=[facet])
        return resp.get("facets", {}).get(facet, {})
