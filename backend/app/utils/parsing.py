"""
Parsing utilities for layer-3 HTML extraction.
No external API calls — uses JSON-LD, regex, and curated vocabulary.
"""

import json
import re
from typing import Optional


# ---------------------------------------------------------------------------
# Curated vocabulary for skill extraction (extend as needed)
# ---------------------------------------------------------------------------
SKILLS_VOCABULARY = [
    # Programming languages
    "Python", "JavaScript", "TypeScript", "Java", "Golang", "Rust", "C++",
    "C#", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "MATLAB", "Perl",
    "Bash", "Shell", "PowerShell", "Dart", "Elixir", "Clojure", "Haskell",
    "Lua", "Objective-C", "Groovy", "VBA", "COBOL", "Assembly",

    # Web frameworks & libraries
    "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte", "Remix",
    "Astro", "Gatsby", "Django", "Flask", "FastAPI", "Spring Boot", "Spring",
    "Express", "Node.js", "Laravel", "Rails", "ASP.NET", "Symfony",
    "Vite", "Webpack", "Bootstrap", "Tailwind CSS", "jQuery",

    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "DynamoDB", "Oracle", "SQLite", "MariaDB", "Neo4j", "Firebase",
    "Firestore", "ClickHouse", "Snowflake", "BigQuery", "Redshift",
    "Databricks", "dbt", "SQL",

    # Cloud & infrastructure
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible",
    "Jenkins", "GitHub Actions", "CircleCI", "GitLab CI", "Helm", "ArgoCD",
    "Prometheus", "Grafana", "Datadog", "Nginx", "Apache",

    # Data & ML
    "TensorFlow", "PyTorch", "scikit-learn", "NumPy", "Pandas", "Spark",
    "Kafka", "Airflow", "MLflow", "Jupyter", "Tableau", "Power BI",
    "Looker", "Ray", "LangChain", "Hugging Face", "OpenAI",

    # APIs & protocols
    "GraphQL", "REST", "gRPC", "WebSockets", "OAuth", "JWT", "SAML",
    "OpenAPI", "Swagger",

    # Tools & practices
    "Git", "Linux", "Jira", "Confluence", "Figma", "Sketch", "Postman",
    "Agile", "Scrum", "Kanban", "CI/CD", "TDD",

    # Business tools
    "Excel", "Salesforce", "HubSpot", "Zendesk", "Google Analytics", "SEO",

    # Soft skills
    "Leadership", "Communication", "Teamwork", "Collaboration", "Mentorship",
]

# ---------------------------------------------------------------------------
# Domain keyword mapping — first match wins
# ---------------------------------------------------------------------------
DOMAIN_KEYWORDS = [
    ("Software Engineering", [
        "engineer", "developer", "backend", "frontend", "fullstack",
        "full-stack", "full stack", "software", "devops", "sre",
        "platform", "cloud", "infrastructure", "api", "architect",
        "programmer", "coder",
    ]),
    ("Data & Analytics", [
        "data analyst", "analytics", "business intelligence", " bi ",
        "reporting", "data engineer", "data scientist", "data science",
        "machine learning", "ml engineer", "ai engineer", "deep learning",
    ]),
    ("Design", [
        "designer", " ux ", " ui ", "product design", "figma",
        "graphic", "visual design", "motion", "user experience",
        "user interface",
    ]),
    ("Product", [
        "product manager", "product owner", " pm ", "product lead",
        "product strategy",
    ]),
    ("Marketing", [
        "marketing", "growth", "seo", "sem", "content strategist",
        "brand", "campaign", "social media", "digital marketing",
        "acquisition", "demand generation", "paid media",
    ]),
    ("Sales", [
        "sales", "account executive", "business development", " sdr ",
        "account manager", "revenue", "closing deals",
    ]),
    ("Finance", [
        "finance", "accounting", "financial analyst", "controller",
        "cfo", "fp&a", "treasury", "audit",
    ]),
    ("Legal", [
        "legal", "lawyer", "attorney", "counsel", "compliance",
        "paralegal",
    ]),
    ("HR & People", [
        "human resources", " hr ", "talent acquisition", "recruiter",
        "people operations", "total rewards",
    ]),
    ("Operations", [
        "operations manager", "supply chain", "logistics",
        "procurement", "process improvement",
    ]),
]


def parse_json_ld(soup) -> dict:
    """
    Extracts job fields from <script type="application/ld+json"> tags
    using the schema.org JobPosting type.
    Returns a partial dict — missing fields are None/[].
    """
    empty = {"title": None, "company": None, "domain": None,
             "skills": [], "contact_email": None}

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (json.JSONDecodeError, Exception):
            continue

        result = _walk_ld(data)
        if result.get("title"):
            return result

    return empty


def _walk_ld(data) -> dict:
    """Recursively walk a JSON-LD object/array looking for JobPosting."""
    empty = {"title": None, "company": None, "domain": None,
             "skills": [], "contact_email": None}

    if isinstance(data, list):
        for item in data:
            r = _walk_ld(item)
            if r.get("title"):
                return r
        return empty

    if not isinstance(data, dict):
        return empty

    # Handle @graph
    if "@graph" in data:
        r = _walk_ld(data["@graph"])
        if r.get("title"):
            return r

    job_types = {"JobPosting", "JobListing"}
    if data.get("@type") not in job_types:
        return empty

    result = {"title": None, "company": None, "domain": None,
              "skills": [], "contact_email": None}

    result["title"] = _text(data.get("title") or data.get("name"))

    org = data.get("hiringOrganization") or {}
    if isinstance(org, dict):
        result["company"] = _text(org.get("name"))
    elif isinstance(org, str):
        result["company"] = org.strip() or None

    industry = data.get("industry") or data.get("occupationalCategory")
    if industry:
        result["domain"] = _text(industry)

    description = _text(data.get("description") or "")
    skills_raw = data.get("skills") or data.get("qualifications") or ""

    if isinstance(skills_raw, list):
        result["skills"] = [s.strip() for s in skills_raw if s]
    elif skills_raw:
        result["skills"] = extract_skills(_text(skills_raw))

    if not result["skills"] and description:
        result["skills"] = extract_skills(description)

    if not result["domain"] and (result.get("title") or description):
        result["domain"] = infer_domain(result.get("title") or "", description)

    result["contact_email"] = extract_email(description)
    return result


def extract_skills(text: str) -> list[str]:
    """Word-boundary match of SKILLS_VOCABULARY against text."""
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for skill in SKILLS_VOCABULARY:
        # (?<!\w) and (?!\w) handle skills with non-word chars (C#, C++, Node.js)
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def infer_domain(title: str, description: str = "") -> Optional[str]:
    """Return the first DOMAIN_KEYWORDS match, or None."""
    combined = f"{title} {description}".lower()
    for domain, keywords in DOMAIN_KEYWORDS:
        for kw in keywords:
            if kw.lower() in combined:
                return domain
    return None


def extract_email(text: str) -> Optional[str]:
    """Return first contact email found, ignoring noreply/system addresses."""
    if not text:
        return None
    skip = {"noreply", "no-reply", "donotreply", "notifications",
            "mailer", "bounce", "example.com", "sentry"}
    for email in re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text):
        if not any(s in email.lower() for s in skip):
            return email
    return None


def _text(value) -> Optional[str]:
    """Flatten a value to a clean string, or None if empty."""
    if value is None:
        return None
    if isinstance(value, list):
        value = " ".join(str(v) for v in value)
    cleaned = re.sub(r"\s+", " ", str(value)).strip()
    return cleaned or None
