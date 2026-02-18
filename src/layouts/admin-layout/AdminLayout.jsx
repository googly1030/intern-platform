// Admin Layout Component
// Wraps admin pages with sidebar and header

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-slate-200">
        {/* Sidebar content */}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200">
          {/* Header content */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
