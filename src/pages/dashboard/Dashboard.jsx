import { useState, useEffect } from 'react';
import {
  StatCard,
  MiniChart,
  CircleProgress,
  ProgressBar,
  ProgressDots,
  SearchFilter,
  DataTable,
  Pagination
} from '../../components/dashboard';
import BulkUploadSection from '../../components/dashboard/BulkUploadSection';
import { getDashboardStats } from '../../services/scoringService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    console.log('Search:', term);
  };

  const handleFilterChange = (filters) => {
    console.log('Filters:', filters);
  };

  // Show loading state
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-neon-red text-4xl">error</span>
          <p className="text-gray-400 mt-2">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate values from stats
  const totalCount = stats?.total_count || 0;
  const avgScore = stats?.avg_score ? Math.round(stats.avg_score) : 0;
  const pendingCount = (stats?.pending_count || 0) + (stats?.processing_count || 0);
  const completedCount = stats?.completed_count || 0;
  const recentSubmissions = stats?.recent_submissions || [];

  // Calculate progress percentages
  const pendingPercent = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const hiredPercent = Math.round((completedCount / 200) * 100); // Target: 200

  return (
    <>
      {/* Header with refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 mb-10 relative border border-white/5">
        {/* Vertical dividers */}
        <div className="hidden lg:block absolute top-4 bottom-4 left-1/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="hidden lg:block absolute top-4 bottom-4 left-2/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="hidden lg:block absolute top-4 bottom-4 left-3/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        <StatCard title="CANDIDATES" value={totalCount.toLocaleString()} trend trendValue={0}>
          <MiniChart />
        </StatCard>

        <StatCard title="AVG_SCORE" value={avgScore} subtitle="/100">
          <div className="flex justify-between items-start h-full mt-4">
            <p className="text-[10px] text-neon-green font-mono">&gt;&gt; CALCULATED</p>
            <CircleProgress value={avgScore} />
          </div>
        </StatCard>

        <StatCard title="PENDING" value={pendingCount} type="amber">
          <ProgressBar value={pendingPercent} color="neon-amber" />
          <p className="text-[10px] text-gray-500 mt-2 font-mono">
            {stats?.processing_count || 0} processing...
          </p>
        </StatCard>

        <StatCard title="COMPLETED" value={completedCount} icon="check_circle" type="green">
          <ProgressDots filled={Math.min(5, Math.round(completedCount / 40))} total={5} />
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Target: 200</p>
        </StatCard>
      </div>

      {/* Divider */}
      <div className="divider-glow w-full mb-8" />

      {/* Search & Filters */}
      <SearchFilter onSearch={handleSearch} onFilterChange={handleFilterChange} />

      {/* Bulk Upload Section */}
      <BulkUploadSection onUploadComplete={fetchStats} />

      {/* Data Table */}
      {recentSubmissions.length > 0 ? (
        <DataTable candidates={recentSubmissions} />
      ) : (
        <div className="border border-white/10 flex items-center justify-center py-20">
          <div className="text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl">person_search</span>
            <p className="text-gray-400 mt-2">No submissions yet</p>
            <p className="text-gray-600 text-sm mt-1">Submit a GitHub URL to get started</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {recentSubmissions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(totalCount / 10))}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default Dashboard;
