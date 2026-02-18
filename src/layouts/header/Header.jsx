// Header Component
// Top navigation bar with user menu

import { Bell, Menu, User } from 'lucide-react';

export default function Header({ onMenuClick }) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5 text-text-muted" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Intern Platform</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-text-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orchid-500 rounded-full" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg">
          <div className="w-8 h-8 bg-orchid-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-orchid-500" />
          </div>
        </button>
      </div>
    </header>
  );
}
