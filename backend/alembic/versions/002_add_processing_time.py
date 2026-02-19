"""add processing_time_ms column

Revision ID: 002
Revises: 001
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add processing_time_ms column to submissions table
    op.add_column(
        'submissions',
        sa.Column('processing_time_ms', sa.Integer, nullable=True)
    )


def downgrade() -> None:
    op.drop_column('submissions', 'processing_time_ms')
