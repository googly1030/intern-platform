"""add custom rules and project structure columns

Revision ID: 003
Revises: 002
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add rules_text and project_structure_text columns to submissions table
    op.add_column(
        'submissions',
        sa.Column('rules_text', sa.Text, nullable=True)
    )
    op.add_column(
        'submissions',
        sa.Column('project_structure_text', sa.Text, nullable=True)
    )


def downgrade() -> None:
    op.drop_column('submissions', 'project_structure_text')
    op.drop_column('submissions', 'rules_text')
