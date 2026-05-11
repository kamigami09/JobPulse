"""add resume_versions table and resume_version_id to jobs

Revision ID: a8b3f2c1d9e4
Revises: f6a4d0e3b978
Create Date: 2026-05-11 18:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = 'a8b3f2c1d9e4'
down_revision = 'f6a4d0e3b978'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'resume_versions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.Text(), nullable=False),
        sa.Column('filename', sa.Text(), nullable=False),
        sa.Column('storage_path', sa.Text(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.Text(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'label', name='resume_versions_user_label_key'),
    )
    op.create_index('ix_resume_versions_user_id', 'resume_versions', ['user_id'])

    op.add_column('jobs', sa.Column('resume_version_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'jobs_resume_version_id_fkey', 'jobs', 'resume_versions',
        ['resume_version_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index('ix_jobs_resume_version_id', 'jobs', ['resume_version_id'])


def downgrade():
    op.drop_index('ix_jobs_resume_version_id', table_name='jobs')
    op.drop_constraint('jobs_resume_version_id_fkey', 'jobs', type_='foreignkey')
    op.drop_column('jobs', 'resume_version_id')
    op.drop_index('ix_resume_versions_user_id', table_name='resume_versions')
    op.drop_table('resume_versions')
