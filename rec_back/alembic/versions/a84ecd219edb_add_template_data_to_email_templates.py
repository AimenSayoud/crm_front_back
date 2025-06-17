"""add_template_data_to_email_templates

Revision ID: a84ecd219edb
Revises: 33bdd5ac94fb
Create Date: 2025-05-29 23:19:52.049178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a84ecd219edb'
down_revision: Union[str, None] = '33bdd5ac94fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rename 'conversation_metadata' column to 'template_data'
    op.alter_column(
        'email_templates', 
        'conversation_metadata', 
        new_column_name='template_data',
        existing_type=sa.dialects.postgresql.JSONB(),
        nullable=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Rename column back to its original name
    op.alter_column(
        'email_templates', 
        'template_data', 
        new_column_name='conversation_metadata',
        existing_type=sa.dialects.postgresql.JSONB(),
        nullable=True
    )
