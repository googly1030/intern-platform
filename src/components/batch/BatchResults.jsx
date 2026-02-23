import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const BatchResultsDisplay = ({ batch, submissions, stats }) => {
  const navigate = useNavigate();

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade.startsWith('A') || grade.startsWith('A+')) return 'text-neon-green';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-yellow-500';
    return 'text-neon-red';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-neon-green';
      case 'processing':
        return 'text-primary animate-pulse';
      case 'failed':
        return 'text-neon-red';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const handleExport = async () => {
    try {
      const { exportBatchResults } = await import('../../services/batchService');
      const blob = await exportBatchResults(batch.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${batch.name}_${batch.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Header */}
      <div className="border border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white font-mono mb-2">
              <span className="text-primary">&gt;&gt;</span> {batch.name}
            </h1>
            {batch.description && (
              <p className="text-sm text-gray-400 font-mono">{batch.description}</p>
            )}
            <p className="text-xs text-gray-500 font-mono mt-2">
              Created {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT_CSV
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 font-mono mb-1">TOTAL</p>
          <p className="text-2xl text-white font-mono">{stats.total}</p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 font-mono mb-1">COMPLETED</p>
          <p className="text-2xl text-neon-green font-mono">{stats.completed}</p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 font-mono mb-1">FAILED</p>
          <p className="text-2xl text-neon-red font-mono">{stats.failed}</p>
        </div>
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 font-mono mb-1">AVG_SCORE</p>
          <p className="text-2xl text-primary font-mono">
            {stats.average_score !== null ? stats.average_score : '-'}
          </p>
        </div>
      </div>

      {/* Scoring Weights Used */}
      {batch.scoring_weights && (
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 font-mono mb-3">SCORING_WEIGHTS_USED</p>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(batch.scoring_weights).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono uppercase">{key}:</span>
                <span className="text-sm text-primary font-mono">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {batch.status === 'processing' && (
        <div className="border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-mono">PROCESSING_PROGRESS</p>
            <p className="text-xs text-primary font-mono">{batch.progress_percentage}%</p>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${batch.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <h3 className="text-sm text-white font-mono">SUBMISSIONS</h3>
        </div>
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-400 font-mono uppercase">
                Candidate
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-400 font-mono uppercase hidden md:table-cell">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-400 font-mono uppercase">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-400 font-mono uppercase">
                Score
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-400 font-mono uppercase">
                Grade
              </th>
              <th className="px-4 py-2 text-right text-xs text-gray-400 font-mono uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-mono">{submission.candidate_name}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-xs text-gray-400 font-mono">{submission.candidate_email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono uppercase ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-mono">
                    {submission.overall_score !== null ? submission.overall_score : '-'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-mono font-bold ${getGradeColor(submission.grade)}`}>
                    {submission.grade || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {submission.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/candidate/${submission.id}`)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                    )}
                    <a
                      href={submission.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title="View GitHub"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
        <span>GRADE_COLORS:</span>
        <span className="text-neon-green">A/A+ = Excellent</span>
        <span className="text-primary">B = Good</span>
        <span className="text-yellow-500">C = Average</span>
        <span className="text-neon-red">D/F = Poor</span>
      </div>
    </div>
  );
};

export default BatchResultsDisplay;
