"""add_missing_candidate_profile_fields

Revision ID: 33bdd5ac94fb
Revises: 8f79ad2748c3
Create Date: 2025-05-28 19:28:07.502176

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33bdd5ac94fb'
down_revision: Union[str, None] = '8f79ad2748c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add missing fields to candidate_profiles table
    op.add_column('candidate_profiles', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('candidate_profiles', sa.Column('nationality', sa.String(100), nullable=True))
    op.add_column('candidate_profiles', sa.Column('address', sa.String(500), nullable=True))
    op.add_column('candidate_profiles', sa.Column('postal_code', sa.String(20), nullable=True))
    op.add_column('candidate_profiles', sa.Column('profile_visibility', sa.String(20), nullable=False, server_default='public'))
    op.add_column('candidate_profiles', sa.Column('is_open_to_opportunities', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('candidate_profiles', sa.Column('cover_letter_url', sa.String(500), nullable=True))
    op.add_column('candidate_profiles', sa.Column('linkedin_url', sa.String(500), nullable=True))
    op.add_column('candidate_profiles', sa.Column('github_url', sa.String(500), nullable=True))
    op.add_column('candidate_profiles', sa.Column('portfolio_url', sa.String(500), nullable=True))
    op.add_column('candidate_profiles', sa.Column('languages', sa.JSON(), nullable=True))
    op.add_column('candidate_profiles', sa.Column('certifications', sa.JSON(), nullable=True))
    op.add_column('candidate_profiles', sa.Column('awards', sa.JSON(), nullable=True))
    op.add_column('candidate_profiles', sa.Column('publications', sa.JSON(), nullable=True))
    op.add_column('candidate_profiles', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove added fields
    op.drop_column('candidate_profiles', 'notes')
    op.drop_column('candidate_profiles', 'publications')
    op.drop_column('candidate_profiles', 'awards')
    op.drop_column('candidate_profiles', 'certifications')
    op.drop_column('candidate_profiles', 'languages')
    op.drop_column('candidate_profiles', 'portfolio_url')
    op.drop_column('candidate_profiles', 'github_url')
    op.drop_column('candidate_profiles', 'linkedin_url')
    op.drop_column('candidate_profiles', 'cover_letter_url')
    op.drop_column('candidate_profiles', 'is_open_to_opportunities')
    op.drop_column('candidate_profiles', 'profile_visibility')
    op.drop_column('candidate_profiles', 'postal_code')
    op.drop_column('candidate_profiles', 'address')
    op.drop_column('candidate_profiles', 'nationality')
    op.drop_column('candidate_profiles', 'date_of_birth')
