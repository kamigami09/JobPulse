from app.models import InterviewPrepTask

DEFAULT_TEMPLATE = [
    # Research
    {"text": "Read company About page and recent news", "category": "research"},
    {"text": "Check Glassdoor reviews and salary data", "category": "research"},
    {"text": "Research the interviewer(s) on LinkedIn", "category": "research"},
    # Technical — skills row is filled dynamically from job.skills
    {"text": "Review required skills from the job posting", "category": "technical"},
    {"text": "Do 2 LeetCode medium problems in the primary language", "category": "technical"},
    {"text": "Prepare a system design talking point relevant to the role", "category": "technical"},
    # Behavioral
    {"text": "Prepare 3 STAR stories (Situation, Task, Action, Result)", "category": "behavioral"},
    {"text": "Prepare answer for 'Why this company?'", "category": "behavioral"},
    {"text": "Prepare answer for 'Why this role?'", "category": "behavioral"},
    # Logistics
    {"text": "Confirm interview time and timezone", "category": "logistics"},
    {"text": "Test camera, microphone, and internet connection", "category": "logistics"},
    {"text": "Prepare 3 questions to ask the interviewer", "category": "logistics"},
    {"text": "Lay out outfit / check background if video call", "category": "logistics"},
]


def seed_default(job, db):
    """Seed the default checklist for a job. Idempotent — no-op if tasks already exist."""
    existing = InterviewPrepTask.query.filter_by(job_id=job.id).count()
    if existing > 0:
        return

    tasks = []
    for i, item in enumerate(DEFAULT_TEMPLATE):
        text = item["text"]
        if "required skills" in text and job.skills:
            text = f"Brush up on: {', '.join(job.skills)}"
        tasks.append(InterviewPrepTask(
            job_id=job.id,
            text=text,
            category=item["category"],
            position=i,
        ))

    db.session.add_all(tasks)
