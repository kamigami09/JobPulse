"""add user_id to jobs with data migration

Revision ID: f6a4d0e3b978
Revises: e5f3c9d2a867
Create Date: 2026-05-11 14:30:00.000000

"""
import os

import bcrypt
import sqlalchemy as sa
from alembic import op

revision = 'f6a4d0e3b978'
down_revision = 'e5f3c9d2a867'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # --- 1. Seed a default user from env vars (only if no users exist yet) ---
    count = conn.execute(sa.text("SELECT COUNT(*) FROM users")).scalar()
    if count == 0:
        raw_name = os.environ.get("AUTH_USERNAME", "admin")
        if "@" in raw_name:
            admin_email = raw_name.lower()
        else:
            admin_email = f"{raw_name.lower()}@jobpulse.local"

        existing_hash = os.environ.get("AUTH_PASSWORD_HASH", "")
        if not existing_hash:
            existing_hash = bcrypt.hashpw(os.urandom(32), bcrypt.gensalt(rounds=12)).decode()

        conn.execute(
            sa.text("INSERT INTO users (email, password_hash) VALUES (:email, :hash)"),
            {"email": admin_email, "hash": existing_hash},
        )

    # --- 2. Add nullable user_id column ---
    op.add_column("jobs", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "jobs_user_id_fkey", "jobs", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )

    # --- 3. Assign all existing jobs to the first (admin) user ---
    conn.execute(sa.text(
        "UPDATE jobs SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1)"
    ))

    # --- 4. Make NOT NULL ---
    op.alter_column("jobs", "user_id", nullable=False)

    # --- 5. Replace unique(url) with unique(user_id, url) ---
    op.drop_constraint("jobs_url_key", "jobs", type_="unique")
    op.create_unique_constraint("jobs_user_id_url_key", "jobs", ["user_id", "url"])

    # --- 6. Index for fast per-user filtering ---
    op.create_index("ix_jobs_user_id", "jobs", ["user_id"])


def downgrade():
    op.drop_index("ix_jobs_user_id", table_name="jobs")
    op.drop_constraint("jobs_user_id_url_key", "jobs", type_="unique")
    op.create_unique_constraint("jobs_url_key", "jobs", ["url"])
    op.drop_constraint("jobs_user_id_fkey", "jobs", type_="foreignkey")
    op.drop_column("jobs", "user_id")
