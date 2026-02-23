# AGENTS.md

> **AI Coding Guidelines for InternAudit AI Platform**
>
> This document defines the standards, patterns, and efficiency rules that AI agents MUST follow when contributing to this codebase.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Python Backend Standards](#python-backend-standards)
3. [React Frontend Standards](#react-frontend-standards)
4. [API & Data Flow](#api--data-flow)
5. [Performance Requirements](#performance-requirements)
6. [Security Standards](#security-standards)
7. [Code Organization](#code-organization)
8. [Testing Guidelines](#testing-guidelines)
9. [Error Handling](#error-handling)
10. [Documentation Standards](#documentation-standards)

---

## Core Principles

### 1. Efficiency First
- **Minimize I/O operations**: Batch database queries, use async operations
- **Cache aggressively**: Use Redis for frequently accessed data
- **Avoid N+1 queries**: Always use eager loading (selectin, joinedload)
- **Connection pooling**: Reuse connections, don't create new ones per request

### 2. Async-First Architecture
```python
# RIGHT - Async database operations
async def get_submission(submission_id: str, db: AsyncSession):
    result = await db.execute(select(Submission).where(Submission.id == submission_id))
    return result.scalar_one_or_none()

# WRONG - Sync operations in async context
def get_submission(submission_id: str, db: AsyncSession):
    # NEVER do this
```

### 3. Fail Fast, Fail Clearly
- Validate inputs at service boundaries
- Use Pydantic for request/response validation
- Return meaningful error messages with HTTP status codes
- Log errors with context (submission_id, user_id, etc.)

---

## Python Backend Standards

### File Structure

```
backend/
├── app/
│   ├── main.py              # Application entry point
│   ├── config.py            # Pydantic settings (environment variables)
│   ├── database.py          # Database connection and session management
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic layer
│   ├── workers/             # Background task processors
│   └── utils/               # Helper utilities
```

### Service Layer Pattern

```python
# services/score_calculator.py
from typing import Optional, Callable
import logging

logger = logging.getLogger(__name__)

class ScoreCalculator:
    """Service for calculating submission scores"""

    def __init__(self, progress_callback: Optional[Callable] = None):
        self.progress_callback = progress_callback

    def calculate(self, submission_data: dict) -> dict:
        """Calculate score with progress tracking"""
        logger.info(f"Calculating score for submission: {submission_data.get('id')}")
        # Implementation here
```

**Rules:**
1. Services MUST be stateless (except for progress callbacks)
2. Services MUST NOT access FastAPI Request/Response directly
3. Services MUST use dependency injection for dependencies
4. All service methods MUST be async if they do I/O

### Route Handler Standards

```python
# routes/submissions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    submission_data: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new submission for scoring.

    Accepts GitHub URL and optional hosted URL.
    Returns submission_id with status "pending".
    Triggers background scoring job.
    """
    try:
        # 1. Validate and create record
        submission = Submission(**submission_data.model_dump())
        db.add(submission)
        await db.flush()
        await db.commit()
        await db.refresh(submission)

        # 2. Trigger background task
        background_tasks.add_task(process_submission, submission.id)

        return SubmissionResponse.model_validate(submission)
    except Exception as e:
        logger.error(f"Failed to create submission: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
```

**Rules:**
1. Routes MUST use Pydantic schemas for request/response
2. Routes MUST use `status.HTTP_*` constants for status codes
3. Database operations MUST use `AsyncSession` with `await`
4. Always use `exc_info=True` in error logging
5. Background tasks for long-running operations

### Configuration Management

```python
# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "InternAudit AI"
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

settings = Settings()
```

**Rules:**
1. All configuration MUST use Pydantic Settings
2. Environment variables MUST be typed
3. Use `@property` for computed values
4. Default values for non-sensitive config only

### Logging Standards

```python
import logging

logger = logging.getLogger(__name__)

# Contextual logging with submission tracking
logger.info(f"[{submission_id}] Starting analysis")
logger.debug(f"[{submission_id}] Found {len(files)} files")
logger.warning(f"[{submission_id}] No deployment URL provided")
logger.error(f"[{submission_id}] Analysis failed: {error}", exc_info=True)
```

**Rules:**
1. Always include `[submission_id]` or `[user_id]` prefix
2. Use `exc_info=True` for exceptions
3. Log start/end of operations
4. Use appropriate log level (DEBUG, INFO, WARNING, ERROR)

---

## React Frontend Standards

### Component Structure

```javascript
// components/dashboard/StatCard.jsx
const StatCard = ({ title, value, type = 'default', children }) => {
  const typeStyles = {
    default: 'text-primary',
    green: 'text-neon-green',
  };

  return (
    <div className="p-6 border-r border-white/5">
      <p className={`${typeStyles[type]} text-xs font-mono`}>
        [ {title} ]
      </p>
      <h3 className="text-4xl font-mono text-white">{value}</h3>
      {children}
    </div>
  );
};

export default StatCard;
```

**Rules:**
1. Components MUST be in appropriate folder (components/{feature}/)
2. Use default export for components
3. Destructure props at function signature
4. Provide default values for optional props
5. Use Tailwind CSS for styling (no inline styles)

### Custom Hooks Standards

```javascript
// hooks/useApi.jsx
import { useState, useCallback, useRef } from "react";

export const useApi = (apiCall, options = {}) => {
  const [state, setState] = useState({
    data: null,
    loading: options.immediate !== false,
    error: null,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await apiCall();

      if (isMountedRef.current) {
        setState({ data: response, loading: false, error: null });
        options.onSuccess?.(response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unexpected error";
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error: errorMsg });
        options.onError?.(errorMsg);
      }
    }
  }, [apiCall, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
};
```

**Rules:**
1. Always use `useCallback` for functions returned from hooks
2. Always use `useRef` to track mount status
3. Cleanup on unmount
4. Return consistent state object: `{ data, loading, error, execute, reset }`

### State Management

```javascript
// RIGHT - Using hooks efficiently
const [formData, setFormData] = useState({ email: '', url: '' });
const [errors, setErrors] = useState({});

const handleChange = useCallback((e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
}, []);

const handleSubmit = useCallback(async () => {
  // Submit logic
}, [formData]);

// WRONG - Unnecessary re-renders
const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  // This creates new object on every render
};
```

**Rules:**
1. Use functional updates for state derived from previous state
2. Use `useCallback` for event handlers passed to children
3. Use `useMemo` for expensive computations only
4. Keep state as close to where it's used as possible

### API Integration

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

**Rules:**
1. Use axios instance with interceptors
2. Handle auth token in request interceptor
3. Handle 401 globally in response interceptor
4. Return `response.data` by default

---

## API & Data Flow

### Request Flow

```
Client → Route Handler (Pydantic validation)
       → Service Layer (business logic)
       → Database (SQLAlchemy async)
       → Response (Pydantic serialization)
```

### Response Format

```python
# Success response
{
    "id": "uuid",
    "status": "completed",
    "overall_score": 85,
    "grade": "A",
    # ... other fields
}

# Error response (HTTP 400+)
{
    "detail": "Human-readable error message"
}
```

**Rules:**
1. Use `response_model` in route decorators
2. Never expose internal errors to clients
3. Use `from_attributes=True` in Pydantic v2
4. Pagination: always return `{ items, total, page, limit }`

---

## Performance Requirements

### Database Operations

```python
# RIGHT - Efficient query with pagination
async def list_submissions(skip: int = 0, limit: int = 20):
    query = select(Submission).order_by(Submission.created_at.desc())
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

# RIGHT - Eager loading to avoid N+1
from sqlalchemy.orm import selectinload

query = select(Submission).options(selectinload(Submission.scores))

# WRONG - N+1 query problem
submissions = await db.execute(select(Submission))
for s in submissions.scalars():
    scores = await db.execute(select(Score).where(Score.submission_id == s.id))
    # This executes N additional queries!
```

### Caching Strategy

```python
# Cache frequently accessed data
from functools import lru_cache

@lru_cache(maxsize=128)
def get_grade_thresholds():
    return [(90, "A+"), (80, "A"), (70, "B"), ...]

# For larger caching, use Redis
# services/github_cache.py
class GitHubCache:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = 3600  # 1 hour

    async def get_commits(self, owner: str, repo: str):
        cache_key = f"github:commits:{owner}/{repo}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        # Fetch from API and cache
```

### Frontend Performance

```javascript
// RIGHT - Code splitting
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Candidates = lazy(() => import('./pages/candidates/Candidates'));

// RIGHT - Memoize expensive operations
const sortedCandidates = useMemo(() => {
  return candidates.sort((a, b) => b.score - a.score);
}, [candidates]);

// RIGHT - Debounce search input
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
);
```

---

## Security Standards

### Input Validation

```python
# Always validate with Pydantic
class SubmissionCreate(BaseModel):
    candidate_name: str
    candidate_email: EmailStr  # Validates email format
    github_url: str
    hosted_url: Optional[str] = None

    @field_validator('github_url')
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        if not re.match(r'https?://github\.com/[^/]+/[^/]+', v):
            raise ValueError('Invalid GitHub URL')
        return v
```

### SQL Injection Prevention

```python
# RIGHT - Parameterized queries
stmt = select(Submission).where(Submission.id == submission_id)

# WRONG - String interpolation (NEVER DO THIS)
stmt = text(f"SELECT * FROM submissions WHERE id = '{submission_id}'")
```

### XSS Prevention

```javascript
// RIGHT - React automatically escapes
<div>{userInput}</div>

// WRONG - Dangerous innerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// If you must use HTML, sanitize it first
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

---

## Code Organization

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Python classes | PascalCase | `CodeAnalyzer`, `Submission` |
| Python functions | snake_case | `calculate_score()`, `get_submission()` |
| Python constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_TIMEOUT` |
| React components | PascalCase | `StatCard`, `CandidateTable` |
| React hooks | camelCase with 'use' prefix | `useApi`, `useFetch` |
| JS functions | camelCase | `handleSubmit()`, `formatDate()` |

### File Naming

```
# Python
services/code_analyzer.py
routes/submissions.py
models/submission.py

# React/JavaScript
components/dashboard/StatCard.jsx
components/dashboard/index.js
hooks/useApi.jsx
pages/dashboard/Dashboard.jsx
```

---

## Testing Guidelines

### Backend Tests

```python
# tests/test_scorer.py
import pytest
from app.services.scorer import Scorer

@pytest.mark.asyncio
async def test_score_submission_with_valid_repo(db_session):
    scorer = Scorer(progress_callback=None)
    result = scorer.score_submission(
        github_url="https://github.com/test/repo",
        submission_id="test-001"
    )
    assert result["status"] == "completed"
    assert result["overall_score"] >= 0

@pytest.mark.asyncio
async def test_score_submission_with_invalid_repo(db_session):
    scorer = Scorer(progress_callback=None)
    result = scorer.score_submission(
        github_url="https://github.com/invalid/repo",
        submission_id="test-002"
    )
    assert result["status"] == "failed"
    assert result["error"] is not None
```

**Rules:**
1. Use pytest for all tests
2. Use `@pytest.mark.asyncio` for async tests
3. Use fixtures for database sessions
4. Mock external API calls
5. Test both success and failure cases

---

## Error Handling

### Backend Error Handling

```python
# services/base.py
class ServiceError(Exception):
    """Base class for service errors"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)

# routes/base.py
@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message, **exc.details}
    )
```

### Frontend Error Handling

```javascript
// RIGHT - Graceful error handling
const { data, loading, error } = useApi(fetchSubmission, {
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => toast.error(`Failed: ${error}`),
});

if (error) {
  return <ErrorState message={error} retry={execute} />;
}

if (loading) {
  return <LoadingSpinner />;
}

return <DataDisplay data={data} />;
```

---

## Documentation Standards

### Python Docstrings

```python
def score_submission(
    self,
    github_url: str,
    submission_id: str,
    hosted_url: Optional[str] = None,
) -> dict:
    """
    Score a submission from GitHub URL.

    Args:
        github_url: GitHub repository URL
        submission_id: Unique ID for the submission
        hosted_url: Optional hosted deployment URL

    Returns:
        dict with complete score report containing:
            - overall_score (int): 0-100 score
            - grade (str): A+, A, B, C, D, or F
            - flags (list): Critical and warning flags

    Raises:
        ServiceError: If GitHub URL is invalid or inaccessible

    Example:
        >>> scorer = Scorer()
        >>> result = scorer.score_submission(
        ...     "https://github.com/user/repo",
        ...     "sub-123"
        ... )
        >>> print(result["grade"])
        'A'
    """
```

### JSDoc for JavaScript

```javascript
/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiCall - The async function to call
 * @param {Object} options - Configuration options
 * @param {Function} [options.onSuccess] - Callback on success
 * @param {Function} [options.onError] - Callback on error
 * @param {boolean} [options.immediate=true] - Execute immediately
 * @returns {{ data, loading, error, execute, reset }}
 */
export const useApi = (apiCall, options = {}) => {
  // implementation
};
```

---

## Quick Reference Checklist

### Before Creating New Code

- [ ] Follow existing file structure
- [ ] Use async/await for I/O operations
- [ ] Add Pydantic schemas for new endpoints
- [ ] Include proper error handling
- [ ] Add logging with context
- [ ] Write tests for new functionality
- [ ] Add docstrings to functions/classes
- [ ] Check for N+1 query issues
- [ ] Validate all user inputs
- [ ] Use environment variables for config

### Before Modifying Existing Code

- [ ] Read existing patterns in the file
- [ ] Match existing style and conventions
- [ ] Don't break API contracts
- [ ] Update related tests
- [ ] Update documentation if behavior changes

### Performance Considerations

- [ ] Can this be cached?
- [ ] Are we doing unnecessary database queries?
- [ ] Should this be a background task?
- [ ] Is the response paginated?
- [ ] Are we using indexes in database queries?
- [ ] Can we use eager loading to avoid N+1?

---

## Anti-Patterns to Avoid

### Python Anti-Patterns

```python
# DON'T - Synchronous I/O in async context
def fetch_data():
    return requests.get(url)  # BLOCKS!

# DON'T - Exposing internal errors
raise HTTPException(status_code=500, detail=str(e))

# DON'T - Raw SQL with interpolation
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# DON'T - Global state
current_submission = {}  # THREAD UNSAFE!
```

### JavaScript Anti-Patterns

```javascript
// DON'T - Direct state mutation
const [data, setData] = useState([]);
data.push(newItem);  // WRONG!
setData([...data, newItem]);  // RIGHT

// DON'T - Missing dependencies
useEffect(() => {
  fetchData();
}, []);  // Missing fetchData dependency

// DON'T - Inline styles
<div style={{ color: 'red' }}>  // Use Tailwind classes
```

---

## Efficiency Standards

### Code Quality Metrics

- **Function length**: Max 50 lines (break into smaller functions)
- **Parameter count**: Max 5 parameters (use object for more)
- **Nesting depth**: Max 4 levels (extract functions)
- **File length**: Max 500 lines (split modules)
- **Import order**: stdlib → third-party → local

### Optimization Priorities

1. **Database queries** - Most critical for performance
2. **External API calls** - Use caching and timeouts
3. **File I/O** - Use async operations
4. **Complex computations** - Consider background tasks
5. **Frontend rendering** - Use memoization appropriately

---

## Summary

This platform follows a **clean architecture** with clear separation of concerns:

- **Routes**: Handle HTTP, validate input, return responses
- **Services**: Contain business logic, are reusable and testable
- **Models**: Define data structure and persistence
- **Schemas**: Define API contracts

**Key Tenets:**
1. Async-first for all I/O
2. Type-safe with Pydantic/TypeScript
3. Fail fast with meaningful errors
4. Log everything with context
5. Cache aggressively
6. Test both success and failure paths
7. Follow existing patterns over inventing new ones

When in doubt, read the existing code and follow the established patterns. Consistency is more important than personal preference.
