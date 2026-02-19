"""
Database Configuration
SQLAlchemy async setup with PostgreSQL
"""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Base class for models
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""

    pass


# Dependency for getting database session
async def get_db() -> AsyncSession:
    """Get database session dependency"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def run_migrations():
    """Run database migrations for new columns"""
    migrations = [
        # Add processing_time_ms column if it doesn't exist
        {
            "name": "add_processing_time_ms",
            "sql": "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER",
        },
    ]

    async with engine.begin() as conn:
        for migration in migrations:
            try:
                await conn.execute(text(migration["sql"]))
                logger.info(f"Migration '{migration['name']}' applied successfully")
            except Exception as e:
                logger.warning(f"Migration '{migration['name']}' skipped or failed: {e}")


async def init_db():
    """Initialize database (create tables and run migrations)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Run migrations for new columns
    await run_migrations()
    logger.info("Database initialization complete")


async def close_db():
    """Close database connections"""
    await engine.dispose()
