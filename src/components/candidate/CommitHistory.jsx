import { useState, useEffect } from 'react';
import api from '../../services/api';

const CommitHistory = ({ githubUrl, submissionId }) => {
  const [commitData, setCommitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (githubUrl && submissionId) {
      fetchCommitHistory();
    } else {
      setLoading(false);
    }
  }, [githubUrl, submissionId]);

  const fetchCommitHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/submissions/${submissionId}/commits`);
      console.log('Commit data received:', data); // Debug
      setCommitData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch commit history:', err);
      setError('Failed to load commit history');
    } finally {
      setLoading(false);
    }
  };

  const getCommitColor = (count) => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-neon-green/30';
    if (count === 2) return 'bg-neon-green/50';
    if (count <= 4) return 'bg-neon-green/70';
    return 'bg-neon-green';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const commits = commitData?.commits || [];
  const totalCommits = commitData?.total_commits || 0;
  const repoName = commitData?.repo_name || 'Repository';
  const activity = commitData?.activity?.weeks || [];

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_HISTORY ]</h3>
        <div className="flex items-center justify-center py-4">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        </div>
      </div>
    );
  }

  if (error || !githubUrl) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_HISTORY ]</h3>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="material-symbols-outlined text-2xl text-gray-600 mb-2">history</span>
          <p className="text-gray-500 font-mono text-[10px]">
            {error || 'NO GITHUB URL'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_HISTORY ]</h3>

      {/* Repo name and total commits */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] text-gray-400 font-mono truncate">{repoName}</p>
        <p className="text-[10px] text-neon-green font-mono">
          <span className="font-bold">{totalCommits}</span> commits
        </p>
      </div>

      {/* Activity Grid */}
      {activity.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-[2px] mb-1">
            {activity.slice(0, 24).map((week, index) => (
              <div
                key={index}
                className={`aspect-square rounded-[1px] ${getCommitColor(week.count || 0)}`}
                title={`${week.count || 0} commits`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-gray-600 font-mono">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-2 h-2 bg-gray-800 rounded-[1px]" />
              <div className="w-2 h-2 bg-neon-green/30 rounded-[1px]" />
              <div className="w-2 h-2 bg-neon-green/50 rounded-[1px]" />
              <div className="w-2 h-2 bg-neon-green/70 rounded-[1px]" />
              <div className="w-2 h-2 bg-neon-green rounded-[1px]" />
            </div>
            <span>More</span>
          </div>
        </div>
      )}

      {/* Commits List */}
      <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
        {commits.length === 0 ? (
          <p className="text-gray-500 font-mono text-[10px] text-center py-2">No commits found</p>
        ) : (
          commits.map((commit, index) => (
            <a
              key={index}
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-white/5 hover:border-primary/30 p-2 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] text-neon-green mt-0.5">commit</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white font-mono truncate">
                    {commit.message}
                  </p>
                  <div className="flex gap-2 mt-1 text-[8px] text-gray-500 font-mono">
                    <span className="text-primary">{commit.sha}</span>
                    <span>by {commit.author}</span>
                    <span>{formatDate(commit.date)}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[12px] text-gray-600">open_in_new</span>
              </div>
            </a>
          ))
        )}
      </div>

      {/* View on GitHub link */}
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1 text-[10px] text-primary hover:text-white font-mono transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        View all commits on GitHub
      </a>
    </div>
  );
};

export default CommitHistory;
