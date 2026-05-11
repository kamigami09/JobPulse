"""add reminder_log table

Revision ID: c3f1a9b2e745
Revises: 88943d69846a
Create Date: 2026-05-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3f1a9b2e745'
down_revision = '88943d69846a'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'reminder_log',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('kind', sa.Text(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('recipient', sa.Text(), nullable=False),
        sa.Column('job_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_reminder_log_sent_at', 'reminder_log', ['sent_at'], postgresql_using='btree')


def downgrade():
    op.drop_index('ix_reminder_log_sent_at', table_name='reminder_log')
    op.drop_table('reminder_log')
