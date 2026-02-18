// User Sidebar Component
// Navigation for intern/user dashboard

import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Settings,
  User
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: FileText, label: 'Tasks' },
  { to: '/submissions', icon: ClipboardList, label: 'My Submissions' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function UserSidebar({ onClose }) {
  return (
    <nav className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Intern Portal</h1>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <ul className="space-y-1 flex-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orchid-500 text-white'
                    : 'text-text-muted hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200">
        <p className="text-xs text-text-muted text-center">
          Intern Platform v1.0
        </p>
      </div>
    </nav>
  );
}
