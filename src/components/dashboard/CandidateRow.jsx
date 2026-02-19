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

const ScoreBadge = ({ score, grade }) => {
  if (score === null || score === undefined) {
    return (
      <div className="inline-block px-2 py-1 border border-gray-600 text-gray-500 text-xs font-bold">
        ---
      </div>
    );
  }

  let colorClass = 'border-neon-red text-neon-red';

  if (score >= 90) {
    colorClass = 'border-neon-green text-neon-green shadow-neon-green';
  } else if (score >= 75) {
    colorClass = 'border-primary text-primary shadow-neon-sm';
  } else if (score >= 50) {
    colorClass = 'border-neon-amber text-neon-amber shadow-neon-amber';
  }

  return (
    <div className={`inline-block px-2 py-1 border ${colorClass} text-xs font-bold`}>
      {grade || score}
    </div>
  );
};

const CandidateRow = ({ candidate }) => {
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract candidate data (handle both API format and legacy format)
  const id = candidate.id || '';
  const name = candidate.candidate_name || candidate.name || 'Unknown';
  const score = candidate.overall_score ?? candidate.score;
  const grade = candidate.grade;
  const status = candidate.status || 'pending';
  const createdAt = candidate.created_at || candidate.date;
  const githubUrl = candidate.github_url || '';

  return (
    <tr className="group hover:bg-white/5 transition-colors">
      {/* Candidate Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative size-10 bg-gray-800 border border-gray-700 group-hover:border-primary flex items-center justify-center text-primary font-bold text-sm">
            {getInitials(name)}
          </div>
          <div>
            <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">
              {name}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">#{id.slice(0, 8)}</div>
          </div>
        </div>
      </td>

      {/* Email (replacing Role column) */}
      <td className="px-6 py-4">
        <div className="text-gray-400 text-xs tracking-wide truncate max-w-[180px]">
          {candidate.candidate_email || '---'}
        </div>
      </td>

      {/* Score */}
      <td className="px-6 py-4 text-center">
        <ScoreBadge score={score} grade={grade} />
      </td>

      {/* GitHub (replacing Tech Stack column) */}
      <td className="px-6 py-4">
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary text-xs truncate max-w-[150px] block transition-colors"
          >
            {githubUrl.replace('https://github.com/', '')}
          </a>
        ) : (
          <span className="text-gray-600 text-xs">---</span>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={status} />
      </td>

      {/* Timestamp */}
      <td className="px-6 py-4">
        <div className="text-gray-500 text-[10px]">
          {formatDate(createdAt)} <span className="text-gray-700">|</span> {formatTime(createdAt)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-400 hover:text-primary transition-colors"
            title="View Profile"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Open GitHub"
            onClick={(e) => {
              e.stopPropagation();
              if (githubUrl) window.open(githubUrl, '_blank');
            }}
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CandidateRow;
