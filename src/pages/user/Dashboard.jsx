export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Dashboard</h1>
      <p className="text-text-muted">Welcome to the Intern Platform!</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Your Tasks</h2>
          <p className="text-text-muted text-sm">View and complete your assigned tasks</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Submissions</h2>
          <p className="text-text-muted text-sm">Track your GitHub submissions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Status</h2>
          <p className="text-text-muted text-sm">Check your application status</p>
        </div>
      </div>
    </div>
  );
}
