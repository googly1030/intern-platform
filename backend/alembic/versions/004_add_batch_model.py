"""add batch model and batch_id to submissions

Revision ID: 004
Revises: 003
Create Date: 2026-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy import inspect

    conn = op.get_bind()
    inspector = inspect(conn)

    # Create submission_batches table only if it doesn't exist
    existing_tables = inspector.get_table_names()
    if 'submission_batches' not in existing_tables:
        op.create_table(
            'submission_batches',
            sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('rules_text', sa.Text, nullable=True),
            sa.Column('project_structure_text', sa.Text, nullable=True),
            sa.Column('scoring_weights', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
            sa.Column('total_submissions', sa.Integer, nullable=False, server_default='0'),
            sa.Column('completed_submissions', sa.Integer, nullable=False, server_default='0'),
            sa.Column('failed_submissions', sa.Integer, nullable=False, server_default='0'),
            sa.Column('error_message', sa.Text, nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        )

        # Create indexes for submission_batches
        op.create_index('ix_submission_batches_status', 'submission_batches', ['status'])
    else:
        # Table exists, check if index exists
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('submission_batches')]
        if 'ix_submission_batches_status' not in existing_indexes:
            op.create_index('ix_submission_batches_status', 'submission_batches', ['status'])

    # Add batch_id column to submissions table only if it doesn't exist
    submissions_columns = [col['name'] for col in inspector.get_columns('submissions')]
    if 'batch_id' not in submissions_columns:
        op.add_column(
            'submissions',
            sa.Column('batch_id', postgresql.UUID(as_uuid=False), nullable=True)
        )

        # Create index for batch_id
        op.create_index('ix_submissions_batch_id', 'submissions', ['batch_id'])
    else:
        # Column exists, check if index exists
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('submissions')]
        if 'ix_submissions_batch_id' not in existing_indexes:
            op.create_index('ix_submissions_batch_id', 'submissions', ['batch_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_submissions_batch_id', table_name='submissions')

    # Remove batch_id column from submissions
    op.drop_column('submissions', 'batch_id')

    # Drop submission_batches table
    op.drop_table('submission_batches')
