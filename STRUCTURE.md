# Intern Platform - Project Structure Reference

## Overview

This document outlines the folder structure and component organization for the Intern Recruitment Platform - a system that automates the intern hiring process by managing tasks, GitHub submissions, and reviews.

---

## Complete Folder Structure

```
intern-platform/
├── public/                          # Static assets
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── assets/                      # Images, fonts, icons
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Shared UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Auth/                    # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignUpForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Dashboard/               # Dashboard widgets
│   │   │   ├── StatsCard.jsx
│   │   │   ├── RecentActivity.jsx
│   │   │   ├── ProgressChart.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Tasks/                   # Task-related components
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskDetails.jsx
│   │   │   ├── TaskUpload.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Submissions/             # Submission components
│   │   │   ├── SubmissionForm.jsx
│   │   │   ├── SubmissionCard.jsx
│   │   │   ├── SubmissionList.jsx
│   │   │   ├── SubmissionStatus.jsx
│   │   │   ├── GitHubLinkInput.jsx
│   │   │   ├── HostedLinkInput.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Interns/                 # Intern management (Admin)
│   │   │   ├── InternCard.jsx
│   │   │   ├── InternList.jsx
│   │   │   ├── InternProfile.jsx
│   │   │   ├── InternFilter.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── Reviews/                 # Review components (Admin)
│   │   │   ├── ReviewCard.jsx
│   │   │   ├── ReviewList.jsx
│   │   │   ├── ReviewDetails.jsx
│   │   │   ├── ReviewActions.jsx
│   │   │   └── index.js
│   │   │
│   │   └── Settings/                # Settings components
│   │       ├── ProfileSettings.jsx
│   │       ├── NotificationSettings.jsx
│   │       └── index.js
│   │
│   ├── contexts/                    # React contexts
│   │   ├── AuthContext.jsx          # Authentication state
│   │   ├── NotificationContext.jsx  # Toast/notification state
│   │   └── ThemeContext.jsx         # Theme preferences
│   │
│   ├── data/                        # Static data & mock data
│   │   ├── mockInterns.js
│   │   ├── mockTasks.js
│   │   └── mockSubmissions.js
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useApi.jsx               # API call utilities
│   │   ├── useAuth.jsx              # Authentication hook
│   │   ├── useInterns.jsx           # Intern data fetching
│   │   ├── useTasks.jsx             # Task data fetching
│   │   ├── useSubmissions.jsx       # Submission data fetching
│   │   └── useLocalStorage.jsx      # Local storage utilities
│   │
│   ├── layouts/                     # Layout components
│   │   ├── Layout.jsx               # Base layout wrapper
│   │   ├── Header.jsx               # Top navigation header
│   │   ├── Sidebar.jsx              # Side navigation
│   │   ├── MobileNav.jsx            # Mobile navigation
│   │   ├── AdminLayout.jsx          # Admin-specific layout
│   │   ├── UserLayout.jsx           # User/Intern layout
│   │   └── AuthLayout.jsx           # Auth pages layout
│   │
│   ├── pages/                       # Page components
│   │   ├── common/                  # Shared pages
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ErrorPage.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Unauthorized.jsx
│   │   │
│   │   ├── user/                    # Intern/User pages
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Tasks.jsx            # Available tasks
│   │   │   ├── TaskDetails.jsx      # Single task view
│   │   │   ├── MySubmissions.jsx    # User's submissions
│   │   │   ├── SubmitTask.jsx       # Submit GitHub/hosted links
│   │   │   ├── Profile.jsx          # User profile
│   │   │   └── Settings.jsx         # User settings
│   │   │
│   │   └── admin/                   # Admin pages
│   │       ├── Dashboard.jsx        # Admin dashboard
│   │       ├── Interns.jsx          # Manage interns
│   │       ├── InternDetails.jsx    # Single intern view
│   │       ├── Tasks.jsx            # Manage tasks
│   │       ├── CreateTask.jsx       # Create new task
│   │       ├── EditTask.jsx         # Edit task
│   │       ├── Submissions.jsx      # Review submissions
│   │       ├── SubmissionReview.jsx # Detailed submission review
│   │       ├── Analytics.jsx        # Platform analytics
│   │       └── Settings.jsx         # Admin settings
│   │
│   ├── routes/                      # Routing configuration
│   │   ├── AppRouter.jsx            # Main router config
│   │   ├── ProtectedRoute.jsx       # Auth-protected routes
│   │   ├── AdminRoute.jsx           # Admin-only routes
│   │   └── routes.js                # Route constants
│   │
│   ├── services/                    # API service layer
│   │   ├── api.js                   # Axios instance & interceptors
│   │   ├── authService.js           # Auth API calls
│   │   ├── internService.js         # Intern API calls
│   │   ├── taskService.js           # Task API calls
│   │   └── submissionService.js     # Submission API calls
│   │
│   ├── utils/                       # Utility functions
│   │   ├── constants.js             # App constants
│   │   ├── helpers.js               # Helper functions
│   │   ├── validators.js            # Form validation
│   │   ├── formatters.js            # Data formatting
│   │   └── storage.js               # Local storage helpers
│   │
│   ├── index.css                    # Global styles & CSS variables
│   └── main.jsx                     # App entry point
│
├── .env.example                     # Environment variables template
├── .gitignore
├── components.json                  # shadcn/ui config
├── eslint.config.js
├── index.html
├── jsconfig.json
├── package.json
├── README.md
├── STRUCTURE.md                     # This file
└── vite.config.js
```

---

## Page Routes

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User/Admin login |
| `/signup` | SignUp | New intern registration |
| `/forgot-password` | ForgotPassword | Password recovery |

### User Routes (Protected)
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | User overview |
| `/tasks` | Tasks | Available tasks list |
| `/tasks/:id` | TaskDetails | Single task with PDF |
| `/submit/:taskId` | SubmitTask | Submit GitHub & hosted links |
| `/submissions` | MySubmissions | User's submission history |
| `/profile` | Profile | User profile |
| `/settings` | Settings | User settings |

### Admin Routes (Protected)
| Route | Page | Description |
|-------|------|-------------|
| `/admin/dashboard` | Dashboard | Admin overview with stats |
| `/admin/interns` | Interns | All interns list |
| `/admin/interns/:id` | InternDetails | Single intern details |
| `/admin/tasks` | Tasks | Manage all tasks |
| `/admin/tasks/create` | CreateTask | Create new task |
| `/admin/tasks/:id/edit` | EditTask | Edit existing task |
| `/admin/submissions` | Submissions | Pending reviews |
| `/admin/submissions/:id` | SubmissionReview | Review & approve/reject |
| `/admin/analytics` | Analytics | Platform analytics |
| `/admin/settings` | Settings | Admin settings |

---

## Component Guidelines

### Naming Conventions
- **Components**: PascalCase (e.g., `TaskCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.jsx`)
- **Utilities**: camelCase (e.g., `formatters.js`)
- **Pages**: PascalCase matching route (e.g., `Dashboard.jsx`)

### File Structure for Components
```jsx
// ComponentName.jsx
import { useState } from 'react';
import { clsx } from 'clsx';

// Types/Props at the top
const ComponentName = ({ prop1, prop2 }) => {
  // State
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {};

  // Render
  return (
    <div className="...">
      {/* Content */}
    </div>
  );
};

export default ComponentName;
```

### Index Exports
Each component folder should have an `index.js` that exports all components:
```js
// components/Tasks/index.js
export { TaskCard } from './TaskCard';
export { TaskList } from './TaskList';
export { TaskDetails } from './TaskDetails';
```

---

## Key Features to Implement

### Phase 1 - Core Setup
- [ ] Authentication (Login/SignUp)
- [ ] User Dashboard
- [ ] Admin Dashboard

### Phase 2 - Task Management
- [ ] Task listing (User view)
- [ ] Task creation (Admin)
- [ ] PDF upload/download
- [ ] Task details page

### Phase 3 - Submissions
- [ ] GitHub URL submission
- [ ] Hosted link submission
- [ ] Submission history

### Phase 4 - Admin Review
- [ ] Submission list view
- [ ] Review details page
- [ ] Approve/Reject actions
- [ ] Status updates

### Phase 5 - Enhancements
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Profile management
- [ ] Settings

---

## Tech Stack Reference

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| HTTP Client | Axios |
| Icons | Lucide React |
| UI Primitives | Radix UI |
| State | React Context + Hooks |

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Notes

- Port: `5174` (to avoid conflict with classify-ui-v2)
- Path alias: `@/` maps to `./src/`
- Font: Manrope (Google Fonts)
- Primary color: Orchid/Purple theme
