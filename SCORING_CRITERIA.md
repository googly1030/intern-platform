# AI Auditor Scoring Criteria

> This document defines the complete scoring rubric for evaluating internship candidate submissions against the task requirements.

---

## Task Overview

**Objective**: Build a signup/login system with the following flow:
```
Register → Login → Profile
```

**Features Required**:
- User registration page
- Login page with credential validation
- Profile page with additional details (age, DOB, contact, etc.)
- User can update their profile

---

## Expected Folder Structure

Candidates must follow this structure:

```
project/
├── assets/                 # Static assets (images, icons, etc.)
├── css/                    # Stylesheets (separate from HTML)
│   └── *.css
├── js/                     # JavaScript files (separate from HTML)
│   ├── login.js
│   ├── profile.js
│   └── register.js
├── php/                    # Backend PHP files (separate from HTML)
│   ├── login.php
│   ├── profile.php
│   └── register.php
├── index.html
├── login.html
├── profile.html
└── register.html
```

---

## Tech Stack Requirements

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | HTML, CSS, JS | Must be in separate files |
| AJAX | jQuery AJAX | No form submission allowed |
| Styling | Bootstrap | Required for responsiveness |
| Backend | PHP | Separate from frontend |
| Primary DB | MySQL | For user profiles |
| Secondary DB | MongoDB | For registered data |
| Session (Frontend) | localStorage | No PHP sessions |
| Session (Backend) | Redis | For session storage |

---

## Scoring Breakdown

### Total Score: 100 points

| Category | Weight | Points |
|----------|--------|--------|
| Critical Requirements | 40% | 40 pts |
| Database Implementation | 25% | 25 pts |
| Code Quality | 20% | 20 pts |
| Folder Structure | 10% | 10 pts |
| Deployment & Extras | 5% | 5 pts |

---

## Detailed Scoring Criteria

### 1. Critical Requirements (40 points)

#### 1.1 File Separation (10 points)
**Requirement**: HTML, JS, CSS, and PHP code must be in **separate files** - none of the code must co-exist in the same file.

| Score | Criteria |
|-------|----------|
| 10 | Perfect separation - all file types in their own files |
| 7 | Minor inline CSS/JS (acceptable for small snippets) |
| 4 | Some mixing but mostly separated |
| 0 | Significant code mixing (inline styles/scripts in HTML, PHP in HTML files) |

**Detection Methods**:
- Check for `<style>` tags in HTML files
- Check for `<script>` tags with inline code in HTML files
- Check for PHP code blocks `<?php ... ?>` in HTML files
- Verify `.js`, `.css`, `.php` files exist in appropriate folders

---

#### 1.2 jQuery AJAX Only (10 points)
**Requirement**: Only use jQuery AJAX for backend interaction - **strictly no form submission**.

| Score | Criteria |
|-------|----------|
| 10 | All backend calls via jQuery AJAX, no form submissions |
| 7 | Mostly AJAX with minor form usage |
| 4 | Mix of AJAX and form submissions |
| 0 | Primarily using form submissions |

**Detection Methods**:
- Search for `<form action="..." method="...">` tags
- Search for `$.ajax`, `$.post`, `$.get` usage
- Check for `submit` event listeners that don't `preventDefault()`
- Look for `type="submit"` buttons without AJAX handling

**Code Patterns to Look For**:
```javascript
// ✅ CORRECT - jQuery AJAX
$.ajax({
    url: 'php/register.php',
    type: 'POST',
    data: userData,
    success: function(response) { ... }
});

// ❌ INCORRECT - Form submission
<form action="php/register.php" method="POST">
```

---

#### 1.3 Bootstrap for Responsiveness (10 points)
**Requirement**: Form must be designed with Bootstrap to maintain page responsiveness.

| Score | Criteria |
|-------|----------|
| 10 | Full Bootstrap implementation with responsive grid |
| 7 | Bootstrap used but some responsive issues |
| 4 | Minimal Bootstrap usage |
| 0 | No Bootstrap or completely non-responsive |

**Detection Methods**:
- Check for Bootstrap CDN link or local Bootstrap files
- Look for Bootstrap classes: `container`, `row`, `col-*`, `form-group`, `btn`, etc.
- Verify responsive behavior on mobile viewport sizes
- Check if forms use Bootstrap form classes

**Bootstrap Classes to Check**:
```
✅ container, container-fluid
✅ row, col-md-*, col-sm-*, col-xs-*
✅ form-group, form-control
✅ btn, btn-primary, btn-block
✅ navbar, nav-item
```

---

#### 1.4 Prepared Statements in MySQL (10 points)
**Requirement**: Always use Prepared Statements - **no usage of simple SQL statements**.

| Score | Criteria |
|-------|----------|
| 10 | All SQL queries use prepared statements |
| 5 | Some prepared statements but also raw SQL |
| 0 | No prepared statements (SQL injection vulnerable) |

**Detection Methods**:
- Search for raw SQL with variable interpolation: `"SELECT * FROM users WHERE id = $id"`
- Look for `prepare()`, `bind_param()`, `execute()` patterns
- Check for PDO prepared statements or mysqli prepared statements
- Flag any direct variable concatenation in queries

**Code Patterns**:
```php
// ✅ CORRECT - Prepared Statement (mysqli)
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

// ✅ CORRECT - Prepared Statement (PDO)
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);

// ❌ INCORRECT - Raw SQL (SQL Injection vulnerable)
$query = "SELECT * FROM users WHERE email = '$email'";
$result = $conn->query($query);
```

---

### 2. Database Implementation (25 points)

#### 2.1 MySQL for User Profiles (8 points)
**Requirement**: Use MySQL for storing user profile details.

| Score | Criteria |
|-------|----------|
| 8 | MySQL properly used with well-structured tables |
| 5 | MySQL used but poor table design |
| 2 | MySQL mentioned but minimal implementation |
| 0 | MySQL not used |

**Check For**:
- MySQL connection configuration
- Profile-related tables: `profiles`, `user_details`, etc.
- Fields: age, DOB, contact, etc.
- Proper data types for each field

---

#### 2.2 MongoDB for Registered Data (8 points)
**Requirement**: Use MongoDB for storing registered user data.

| Score | Criteria |
|-------|----------|
| 8 | MongoDB properly used with good document structure |
| 5 | MongoDB used but poor document design |
| 2 | MongoDB mentioned but minimal implementation |
| 0 | MongoDB not used |

**Check For**:
- MongoDB connection configuration
- Collection for registered users
- Document structure for user registration data
- Proper use of MongoDB features (if applicable)

---

#### 2.3 Redis for Backend Session (5 points)
**Requirement**: Use Redis to store session information in the backend.

| Score | Criteria |
|-------|----------|
| 5 | Redis properly implemented for session management |
| 3 | Redis used but not for sessions |
| 0 | Redis not implemented |

**Check For**:
- Redis connection configuration
- Session storage in Redis
- Session retrieval and validation
- Token/session ID management

---

#### 2.4 localStorage for Frontend Session (4 points)
**Requirement**: Login session must be maintained using browser localStorage - **no PHP sessions**.

| Score | Criteria |
|-------|----------|
| 4 | localStorage properly used for session management |
| 2 | localStorage used but also PHP sessions |
| 0 | Only PHP sessions or no session management |

**Detection Methods**:
- Check for `localStorage.setItem()`, `localStorage.getItem()`
- Verify session token/user data stored in localStorage
- Check for absence of `$_SESSION` in PHP files
- Look for session validation on page load

**Code Patterns**:
```javascript
// ✅ CORRECT - localStorage session
// Store session
localStorage.setItem('userToken', response.token);
localStorage.setItem('userData', JSON.stringify(response.user));

// Retrieve session
const token = localStorage.getItem('userToken');
const user = JSON.parse(localStorage.getItem('userData'));

// ❌ INCORRECT - PHP session in frontend
// PHP sessions should not be used
```

---

### 3. Code Quality (20 points)

#### 3.1 Variable Naming & Conventions (5 points)
| Score | Criteria |
|-------|----------|
| 5 | Consistent, meaningful naming throughout |
| 3 | Mostly good naming with some inconsistencies |
| 1 | Poor naming conventions |
| 0 | Incomprehensible variable names |

**Check For**:
- Consistent casing (camelCase for JS, snake_case for PHP)
- Meaningful variable/function names
- No single-letter variables (except loop counters)
- Constants in UPPER_CASE

---

#### 3.2 Modularity & Code Organization (5 points)
| Score | Criteria |
|-------|----------|
| 5 | Well-organized, modular code with clear separation |
| 3 | Some organization but could be better |
| 1 | Monolithic code with poor organization |
| 0 | Spaghetti code |

**Check For**:
- Functions are single-purpose
- Code is DRY (Don't Repeat Yourself)
- Logical grouping of related functions
- No deeply nested conditions

---

#### 3.3 Error Handling (5 points)
| Score | Criteria |
|-------|----------|
| 5 | Comprehensive error handling with user feedback |
| 3 | Basic error handling present |
| 1 | Minimal error handling |
| 0 | No error handling |

**Check For**:
- Try-catch blocks for database operations
- AJAX error callbacks
- User-friendly error messages
- Form validation feedback
- Database connection error handling

---

#### 3.4 Security Best Practices (5 points)
| Score | Criteria |
|-------|----------|
| 5 | Multiple security measures implemented |
| 3 | Basic security measures |
| 1 | Minimal security awareness |
| 0 | Security vulnerabilities present |

**Check For**:
- Password hashing (bcrypt, password_hash)
- Input sanitization
- CSRF protection (if applicable)
- XSS prevention
- Secure session handling

---

### 4. Folder Structure (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Exact match to expected structure |
| 7 | Minor deviations but well organized |
| 4 | Partially follows structure |
| 0 | Does not follow structure |

**Required Folders**:
- ✅ `assets/` - for static files
- ✅ `css/` - for stylesheets
- ✅ `js/` - for JavaScript files
- ✅ `php/` - for backend PHP files

**Required Files**:
- ✅ `index.html`
- ✅ `login.html`
- ✅ `profile.html`
- ✅ `register.html`
- ✅ `js/login.js`, `js/profile.js`, `js/register.js`
- ✅ `php/login.php`, `php/profile.php`, `php/register.php`

---

### 5. Deployment & Extras (5 points)

#### 5.1 Deployment Status (3 points)
| Score | Criteria |
|-------|----------|
| 3 | Successfully deployed and accessible |
| 2 | Deployed with minor issues |
| 1 | Deployment attempted but not working |
| 0 | Not deployed |

**Validation**:
- HTTP status code check (200 OK)
- Page load verification
- Screenshot comparison

---

#### 5.2 Bonus Features (2 points)
| Score | Criteria |
|-------|----------|
| 2 | Thoughtful additional features |
| 1 | Minor extras |
| 0 | Just basic requirements |

**Examples of Bonus Features**:
- Remember me functionality
- Password strength indicator
- Form validation animations
- Loading states
- Password visibility toggle
- Email verification simulation

---

## AI-Generation Detection

### Risk Indicators

| Indicator | Weight | Description |
|-----------|--------|-------------|
| Single Commit | High | Entire project pushed in one commit |
| Perfect Code | Medium | Unusually clean code for internship level |
| No Iterations | Medium | No evidence of debugging/iteration |
| Generic Comments | Low | AI-style explanatory comments |
| Uniform Style | Low | Perfectly consistent style throughout |

### AI-Generation Score: 0.0 - 1.0

```
0.0-0.3: Low risk (likely human-written)
0.3-0.6: Medium risk (possible AI assistance)
0.6-1.0: High risk (likely AI-generated)
```

**Note**: AI assistance is acceptable, but the system flags submissions for review if the entire project appears to be copied without understanding.

---

## Flag System

The auditor will generate flags for the reviewer:

### Critical Flags (Auto-Reject Warnings)
- 🚫 `NO_BOOTSTRAP` - Bootstrap not used
- 🚫 `FORM_SUBMISSION_USED` - Form submission instead of AJAX
- 🚫 `SQL_INJECTION_RISK` - No prepared statements
- 🚫 `PHP_SESSION_USED` - PHP sessions instead of localStorage
- 🚫 `NO_MYSQL` - MySQL not implemented
- 🚫 `NO_MONGODB` - MongoDB not implemented
- 🚫 `NO_REDIS` - Redis not implemented

### Warning Flags (Review Needed)
- ⚠️ `CODE_MIXING` - HTML/JS/CSS/PHP in same files
- ⚠️ `POOR_FOLDER_STRUCTURE` - Doesn't match expected structure
- ⚠️ `NO_ERROR_HANDLING` - Missing error handling
- ⚠️ `AI_GENERATED_HIGH` - High probability of AI generation
- ⚠️ `NO_DEPLOYMENT` - Project not deployed

### Info Flags (For Context)
- ℹ️ `VIDEO_DEMO_PROVIDED` - Video demo instead of deployment
- ℹ️ `BONUS_FEATURES` - Additional features implemented
- ℹ️ `DOCUMENTATION_INCLUDED` - README or docs provided

---

## Final Score Calculation

```
Final Score = (Critical × 0.40) + (Database × 0.25) + (Quality × 0.20) + (Structure × 0.10) + (Deployment × 0.05)
```

### Score Interpretation

| Score Range | Grade | Recommendation |
|-------------|-------|----------------|
| 90-100 | A+ | Strong interview candidate |
| 80-89 | A | Interview recommended |
| 70-79 | B | Consider for interview |
| 60-69 | C | Request more information |
| 50-59 | D | Reject with feedback |
| 0-49 | F | Auto-reject |

---

## Report Output Format

For each candidate, the AI Auditor generates:

```json
{
  "candidateId": "sub_abc123",
  "overallScore": 78,
  "grade": "B",
  "recommendation": "Consider for interview",
  "scores": {
    "fileSeparation": 10,
    "jqueryAjax": 10,
    "bootstrap": 8,
    "preparedStatements": 10,
    "mysql": 8,
    "mongodb": 6,
    "redis": 5,
    "localStorage": 4,
    "namingConventions": 4,
    "modularity": 3,
    "errorHandling": 3,
    "security": 3,
    "folderStructure": 7,
    "deployment": 2,
    "bonusFeatures": 1
  },
  "flags": ["VIDEO_DEMO_PROVIDED", "POOR_FOLDER_STRUCTURE"],
  "aiGenerationRisk": 0.25,
  "strengths": [
    "Excellent use of prepared statements",
    "Clean jQuery AJAX implementation",
    "Good localStorage session management"
  ],
  "weaknesses": [
    "MongoDB implementation could be improved",
    "Minor folder structure deviations",
    "Could benefit from more error handling"
  ],
  "screenshots": {
    "desktop": "/screenshots/sub_abc123_desktop.png",
    "mobile": "/screenshots/sub_abc123_mobile.png"
  },
  "deploymentUrl": null,
  "videoUrl": "https://drive.google.com/..."
}
```

---

## Usage Notes

1. **Critical Requirements** are non-negotiable - failure in these areas significantly impacts the score
2. **Database Implementation** requires actual usage, not just configuration files
3. **Code Quality** is subjective but follows consistent patterns
4. **Folder Structure** should match exactly for full points
5. **Deployment** is preferred but video demos are acceptable alternatives

---

*Last updated: February 2026*
