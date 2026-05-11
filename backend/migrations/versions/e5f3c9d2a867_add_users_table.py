"""add users table

Revision ID: e5f3c9d2a867
Revises: d4e2b8c1f956
Create Date: 2026-05-11 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f3c9d2a867'
down_revision = 'd4e2b8c1f956'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='users_email_key'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)


def downgrade():
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
