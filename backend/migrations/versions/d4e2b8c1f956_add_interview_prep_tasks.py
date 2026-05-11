"""add interview_prep_tasks table

Revision ID: d4e2b8c1f956
Revises: c3f1a9b2e745
Create Date: 2026-05-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e2b8c1f956'
down_revision = 'c3f1a9b2e745'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'interview_prep_tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('category', sa.Text(), nullable=False),
        sa.Column('done', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_prep_job_id_position', 'interview_prep_tasks', ['job_id', 'position'])


def downgrade():
    op.drop_index('ix_prep_job_id_position', table_name='interview_prep_tasks')
    op.drop_table('interview_prep_tasks')
