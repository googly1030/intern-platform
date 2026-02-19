-- Run this SQL to add the missing column
-- Connect to your PostgreSQL database and execute:

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- If you want to run migrations properly, activate your virtual environment and run:
-- cd backend
-- source venv/bin/activate  (or your venv activation command)
-- alembic upgrade head
