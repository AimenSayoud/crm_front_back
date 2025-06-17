"""Add missing fields to jobs table

Revision ID: 8f79ad2748c3
Revises: b1c0061014f3
Create Date: 2025-05-26 21:53:45.109711

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f79ad2748c3'
down_revision: Union[str, None] = 'b1c0061014f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add missing columns to jobs table
    op.add_column('jobs', sa.Column('is_hybrid', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('jobs', sa.Column('benefits', sa.dialects.postgresql.JSONB(), nullable=True))
    op.add_column('jobs', sa.Column('company_culture', sa.Text(), nullable=True))
    op.add_column('jobs', sa.Column('requires_cover_letter', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('jobs', sa.Column('internal_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the added columns
    op.drop_column('jobs', 'internal_notes')
    op.drop_column('jobs', 'requires_cover_letter')
    op.drop_column('jobs', 'company_culture')
    op.drop_column('jobs', 'benefits')
    op.drop_column('jobs', 'is_hybrid')
