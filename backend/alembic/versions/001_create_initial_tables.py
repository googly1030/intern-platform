"""create initial tables

Revision ID: 001
Revises:
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create submissions table
    op.create_table(
        'submissions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('candidate_name', sa.String(255), nullable=False),
        sa.Column('candidate_email', sa.String(255), nullable=False),
        sa.Column('github_url', sa.String(500), nullable=False),
        sa.Column('hosted_url', sa.String(500), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('overall_score', sa.Integer, nullable=True),
        sa.Column('grade', sa.String(5), nullable=True),
        sa.Column('recommendation', sa.String(100), nullable=True),
        sa.Column('scores', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('flags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ai_generation_risk', sa.Float, nullable=True),
        sa.Column('strengths', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('weaknesses', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('screenshots', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('analysis_details', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('repo_path', sa.String(500), nullable=True),
    )

    # Create indexes
    op.create_index('ix_submissions_candidate_email', 'submissions', ['candidate_email'])
    op.create_index('ix_submissions_task_id', 'submissions', ['task_id'])
    op.create_index('ix_submissions_status', 'submissions', ['status'])

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('expected_structure', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tech_requirements', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('scoring_criteria', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('tasks')
    op.drop_table('submissions')
