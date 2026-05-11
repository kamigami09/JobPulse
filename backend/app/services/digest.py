from datetime import datetime, timedelta, timezone
from typing import TypedDict


class DigestData(TypedDict):
    new_jobs: list        # Saved, scraped in last 7 days
    stale_applied: list   # Applied, applied_at > 14 days ago
    needs_review: list    # needs_review status
    total: int            # sum across all sections
    generated_at: str


def build_digest(jobs: list) -> DigestData:
    """
    Pure function: takes a list of Job ORM objects, returns structured digest dict.
    No I/O, fully testable.
    """
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    fortnight_ago = now - timedelta(days=14)

    new_jobs = []
    stale_applied = []
    needs_review = []

    for job in jobs:
        scraped_at = _as_utc(job.scraped_at)
        applied_at = _as_utc(job.applied_at) if job.applied_at else None

        if job.status == "Saved" and scraped_at and scraped_at >= week_ago:
            new_jobs.append(_job_to_dict(job))
        elif job.status == "Applied" and applied_at and applied_at <= fortnight_ago:
            stale_applied.append(_job_to_dict(job))
        elif job.status == "needs_review":
            needs_review.append(_job_to_dict(job))

    return DigestData(
        new_jobs=new_jobs,
        stale_applied=stale_applied,
        needs_review=needs_review,
        total=len(new_jobs) + len(stale_applied) + len(needs_review),
        generated_at=now.isoformat(),
    )


def _as_utc(dt) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _job_to_dict(job) -> dict:
    return {
        "id": job.id,
        "title": job.title or "Untitled",
        "company": job.company or "Unknown company",
        "url": job.url,
        "status": job.status,
        "skills": job.skills or [],
        "domain": job.domain or "",
        "scraped_at": job.scraped_at.strftime("%Y-%m-%d") if job.scraped_at else "",
        "applied_at": job.applied_at.strftime("%Y-%m-%d") if job.applied_at else "",
    }
