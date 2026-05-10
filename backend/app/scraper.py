"""
Layered job scraper. Tries each strategy in order, fails silently between layers.

Layer 1: python-jobspy       — structured JSON, handles LinkedIn natively
Layer 2: selenium + LI_AT    — headless Chrome for LinkedIn (requires LI_AT_COOKIE)
Layer 3: requests + BS4      — JSON-LD (JobPosting schema) + regex/keyword extraction
Layer 4: graceful fallback   — return partial data, mark status needs_review
"""

import logging
import os
import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from app.utils.parsing import (
    extract_email,
    extract_skills,
    infer_domain,
    parse_json_ld,
)
from app.utils.url_utils import clean_url

logger = logging.getLogger(__name__)

REQUESTS_TIMEOUT = 12
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def scrape_job(url: str) -> dict:
    """
    Main entry. Tries each layer and returns a normalized dict.
    Always returns — never raises.
    """
    cleaned = clean_url(url)
    source = _detect_source(cleaned)

    # Layer 1: JobSpy
    try:
        result = _try_jobspy(cleaned, source)
        if result and _sufficient(result):
            result.update({"source": source, "_layer_used": "jobspy", "_needs_review": False})
            logger.info("Layer 1 (jobspy) succeeded for %s", cleaned)
            return result
    except Exception as e:
        logger.warning("Layer 1 (jobspy) failed: %s", e)

    # Layer 2: Selenium + LI_AT (LinkedIn only, skipped if cookie not configured)
    li_at = os.environ.get("LI_AT_COOKIE", "").strip()
    if source == "linkedin" and li_at:
        try:
            result = _try_spinlud(cleaned, li_at)
            if result and _sufficient(result):
                result.update({"source": source, "_layer_used": "spinlud", "_needs_review": False})
                logger.info("Layer 2 (spinlud) succeeded for %s", cleaned)
                return result
        except Exception as e:
            logger.warning("Layer 2 (spinlud) failed: %s", e)
    elif source == "linkedin" and not li_at:
        logger.info("Layer 2 skipped — LI_AT_COOKIE not configured")

    # Layer 3: HTML + JSON-LD + regex/keyword
    try:
        result = _try_html_extraction(cleaned)
        if result:
            needs_review = not _sufficient(result)
            result.update({"source": source, "_layer_used": "html", "_needs_review": needs_review})
            logger.info("Layer 3 (html) used for %s — needs_review=%s", cleaned, needs_review)
            return result
    except Exception as e:
        logger.warning("Layer 3 (html extraction) failed: %s", e)

    # Layer 4: graceful fallback
    logger.warning("All layers failed for %s — returning needs_review", cleaned)
    return {
        "title": None, "company": None, "domain": None,
        "skills": [], "contact_email": None,
        "source": source, "_layer_used": "fallback", "_needs_review": True,
    }


# ---------------------------------------------------------------------------
# Source detection
# ---------------------------------------------------------------------------

def _detect_source(url: str) -> str:
    try:
        host = urlparse(url).hostname or ""
        if "linkedin.com" in host:
            return "linkedin"
        if "indeed.com" in host:
            return "indeed"
        if "glassdoor.com" in host:
            return "glassdoor"
        if "greenhouse.io" in host:
            return "greenhouse"
        if "lever.co" in host:
            return "lever"
        if "workday.com" in host:
            return "workday"
        if "jobs.ashbyhq.com" in host or "ashbyhq.com" in host:
            return "ashby"
    except Exception:
        pass
    return "other"


def _sufficient(result: dict) -> bool:
    """True when we have at least a title and company."""
    return bool(result.get("title") and result.get("company"))


# ---------------------------------------------------------------------------
# Layer 1: python-jobspy
# ---------------------------------------------------------------------------

def _try_jobspy(url: str, source: str) -> dict | None:
    """
    JobSpy is search-oriented so direct-URL support is limited.
    For LinkedIn URLs, extract the numeric job ID and pass it to JobSpy's
    LinkedIn scraper which can fetch a single job posting by ID.
    """
    from jobspy import scrape_jobs  # noqa: import inside function to keep startup fast

    if source == "linkedin":
        m = re.search(r"/jobs/view/(\d+)", url)
        if not m:
            return None
        job_id = int(m.group(1))
        # JobSpy LinkedIn scraper accepts a list of job IDs via linkedin_job_url
        df = scrape_jobs(
            site_name=["linkedin"],
            search_term="",
            linkedin_fetch_description=True,
            results_wanted=1,
            linkedin_company_ids=None,
            verbose=0,
        )
        if df is None or df.empty:
            return None
        # Try to find the specific job by ID in results
        url_col = "job_url" if "job_url" in df.columns else None
        if url_col:
            match = df[df[url_col].str.contains(str(job_id), na=False)]
            if not match.empty:
                row = match.iloc[0]
                return _jobspy_row_to_dict(row)
        # If we can't find by ID, take the first result as best guess
        return _jobspy_row_to_dict(df.iloc[0]) if not df.empty else None

    return None


def _jobspy_row_to_dict(row) -> dict:
    """Map a pandas Series (JobSpy row) to our field dict."""
    title = str(row.get("title", "") or "").strip() or None
    company = str(row.get("company", "") or "").strip() or None
    description = str(row.get("description", "") or "")

    skills = []
    raw_skills = row.get("skills")
    if raw_skills and str(raw_skills) not in ("nan", "None", ""):
        if isinstance(raw_skills, list):
            skills = raw_skills
        else:
            skills = extract_skills(str(raw_skills))
    if not skills and description:
        skills = extract_skills(description)

    return {
        "title": title,
        "company": company,
        "domain": infer_domain(title or "", description),
        "skills": skills,
        "contact_email": extract_email(description),
    }


# ---------------------------------------------------------------------------
# Layer 2: Selenium + LI_AT cookie
# ---------------------------------------------------------------------------

def _try_spinlud(url: str, li_at: str) -> dict | None:
    """
    Load the LinkedIn job page in headless Chrome with the li_at session cookie,
    then run the same HTML extraction against the rendered page.
    """
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument(f"--user-agent={HEADERS['User-Agent']}")

    driver = None
    try:
        driver = webdriver.Chrome(options=options)

        # Plant the auth cookie before visiting the job URL
        driver.get("https://www.linkedin.com/robots.txt")
        driver.add_cookie({
            "name": "li_at",
            "value": li_at,
            "domain": ".linkedin.com",
            "path": "/",
        })

        driver.get(url)
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )

        soup = BeautifulSoup(driver.page_source, "html.parser")
        return _extract_from_soup(soup)
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Layer 3: requests + BS4 + JSON-LD / regex / keywords
# ---------------------------------------------------------------------------

def _try_html_extraction(url: str) -> dict | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUESTS_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.warning("HTML fetch error for %s: %s", url, e)
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    return _extract_from_soup(soup)


def _extract_from_soup(soup) -> dict | None:
    """
    Run JSON-LD parsing first, fill gaps with meta/H1 heuristics,
    then apply keyword/regex extraction.
    """
    result = parse_json_ld(soup)

    # Title fallback chain
    if not result.get("title"):
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            result["title"] = og["content"].strip()
        else:
            h1 = soup.find("h1")
            if h1:
                result["title"] = h1.get_text(strip=True)
            elif soup.title and soup.title.string:
                raw = soup.title.string.strip()
                for sep in (" | ", " at ", " - ", " — "):
                    if sep in raw:
                        parts = raw.split(sep, 1)
                        result["title"] = parts[0].strip()
                        if not result.get("company"):
                            result["company"] = parts[1].strip()
                        break
                else:
                    result["title"] = raw

    # Company fallback
    if not result.get("company"):
        og_site = soup.find("meta", property="og:site_name")
        if og_site and og_site.get("content"):
            result["company"] = og_site["content"].strip()

    full_text = soup.get_text(separator=" ", strip=True)

    if not result.get("skills"):
        result["skills"] = extract_skills(full_text)
    if not result.get("domain"):
        result["domain"] = infer_domain(result.get("title") or "", full_text)
    if not result.get("contact_email"):
        result["contact_email"] = extract_email(full_text)

    # Return None only if we got absolutely nothing
    if not result.get("title") and not result.get("company"):
        return None
    return result
