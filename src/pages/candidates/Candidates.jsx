import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSubmissions } from '../../services/scoringService';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    completed: {
      text: 'Completed',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-neon-green border-neon-green/30 shadow-[0_0_5px_rgba(0,255,65,0.2)]',
      pulse: false
    },
    processing: {
      text: 'Processing',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-primary border-primary/30 shadow-[0_0_5px_rgba(0,255,255,0.2)]',
      pulse: true
    },
    pending: {
      text: 'Pending',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-neon-amber border-neon-amber/30 shadow-[0_0_5px_rgba(255,204,0,0.2)]',
      pulse: true
    },
    failed: {
      text: 'Failed',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-neon-red border-neon-red/30 shadow-[0_0_5px_rgba(255,0,0,0.2)]',
      pulse: false
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={config.className}>
      {config.pulse && <span className="animate-pulse mr-1">●</span>}
      {config.text}
    </span>
  );
};

const GradeBadge = ({ grade, score }) => {
  if (!grade && !score) {
    return (
      <div className="inline-block px-2 py-1 border border-gray-600 text-gray-500 text-xs font-bold">
        ---
      </div>
    );
  }

  let colorClass = 'border-gray-500 text-gray-400';

  if (score >= 90) {
    colorClass = 'border-neon-green text-neon-green shadow-neon-green';
  } else if (score >= 80) {
    colorClass = 'border-primary text-primary shadow-neon-sm';
  } else if (score >= 70) {
    colorClass = 'border-neon-amber text-neon-amber shadow-neon-amber';
  } else {
    colorClass = 'border-neon-red text-neon-red';
  }

  return (
    <div className={`inline-block px-2 py-1 border ${colorClass} text-xs font-bold`}>
      {grade || score || '---'}
    </div>
  );
};

const CandidateRow = ({ submission, onClick }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <tr
      className="group hover:bg-white/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Candidate Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative size-10 bg-gray-800 border border-gray-700 group-hover:border-primary flex items-center justify-center text-primary font-bold text-sm">
            {getInitials(submission.candidate_name)}
          </div>
          <div>
            <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">
              {submission.candidate_name}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">#{submission.id.slice(0, 8)}</div>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-6 py-4">
        <div className="text-gray-400 text-xs tracking-wide truncate max-w-[200px]">
          {submission.candidate_email}
        </div>
      </td>

      {/* Score/Grade */}
      <td className="px-6 py-4 text-center">
        <GradeBadge grade={submission.grade} score={submission.overall_score} />
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={submission.status} />
      </td>

      {/* GitHub URL */}
      <td className="px-6 py-4">
        <a
          href={submission.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary text-xs truncate max-w-[150px] block"
          onClick={(e) => e.stopPropagation()}
        >
          {submission.github_url.replace('https://github.com/', '')}
        </a>
      </td>

      {/* Timestamp */}
      <td className="px-6 py-4">
        <div className="text-gray-500 text-[10px]">
          {formatDate(submission.created_at)} <span className="text-gray-700">|</span> {formatTime(submission.created_at)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-400 hover:text-primary transition-colors"
            title="View Details"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="GitHub"
            onClick={(e) => {
              e.stopPropagation();
              window.open(submission.github_url, '_blank');
            }}
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

const Candidates = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await listSubmissions(params);
      setSubmissions(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (submission) => {
    navigate(`/candidate/${submission.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white terminal-glow">CANDIDATES</h1>
          <p className="text-gray-500 text-sm mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-gray-700 text-gray-300 text-sm px-3 py-1.5 focus:border-primary focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {/* Refresh Button */}
          <button
            onClick={fetchSubmissions}
            className="flex items-center gap-2 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-black/50 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              <span className="text-sm">Loading candidates...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-neon-red text-4xl">error</span>
              <p className="text-gray-400 mt-2">{error}</p>
              <button
                onClick={fetchSubmissions}
                className="mt-4 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-gray-600 text-4xl">person_search</span>
              <p className="text-gray-400 mt-2">No candidates found</p>
              <p className="text-gray-600 text-sm mt-1">Submit a GitHub URL to get started</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.map((submission) => (
                <CandidateRow
                  key={submission.id}
                  submission={submission}
                  onClick={() => handleRowClick(submission)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Candidates;
