export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Admin Dashboard</h1>
      <p className="text-text-muted">Manage intern applications and tasks</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-3xl font-bold text-text-primary mb-1">0</h2>
          <p className="text-text-muted text-sm">Total Interns</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-3xl font-bold text-text-primary mb-1">0</h2>
          <p className="text-text-muted text-sm">Pending Reviews</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-3xl font-bold text-text-primary mb-1">0</h2>
          <p className="text-text-muted text-sm">Active Tasks</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-3xl font-bold text-text-primary mb-1">0</h2>
          <p className="text-text-muted text-sm">Completed</p>
        </div>
      </div>
    </div>
  );
}
