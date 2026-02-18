// Admin Sidebar Component
// Navigation for admin dashboard

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/interns', icon: Users, label: 'Interns' },
  { to: '/admin/tasks', icon: FileText, label: 'Tasks' },
  { to: '/admin/submissions', icon: ClipboardCheck, label: 'Submissions' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  return (
    <nav className="flex flex-col h-full p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary">Admin Panel</h1>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
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
    </nav>
  );
}
