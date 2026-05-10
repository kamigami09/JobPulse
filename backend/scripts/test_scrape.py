"""
Usage: python scripts/test_scrape.py [url]
If no URL is given, runs against a set of test URLs covering different layers.
"""

import json
import sys
import os

# Ensure app package is importable from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env so DATABASE_URL etc. are available
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from app.scraper import scrape_job

TEST_URLS = [
    # Greenhouse-hosted job (JSON-LD JobPosting schema — Layer 3)
    "https://boards.greenhouse.io/figma/jobs/4014",
    # Lever-hosted job (also has JSON-LD)
    "https://jobs.lever.co/vercel",
    # Bad / empty URL to test graceful fallback
    "https://example.com/jobs/this-does-not-exist",
]


def run(url: str):
    print(f"\n{'='*60}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    result = scrape_job(url)
    layer = result.pop("_layer_used", "?")
    needs_review = result.pop("_needs_review", False)
    print(f"Layer used : {layer}")
    print(f"Needs review: {needs_review}")
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    urls = sys.argv[1:] if len(sys.argv) > 1 else TEST_URLS
    for url in urls:
        run(url)
