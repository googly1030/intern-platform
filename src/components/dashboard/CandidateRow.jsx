const StatusBadge = ({ status }) => {
  const statusConfig = {
    interviewing: {
      text: 'Interviewing',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-primary border-primary/30 shadow-[0_0_5px_rgba(0,255,255,0.2)]',
      pulse: true
    },
    'offer-sent': {
      text: '✓ Offer_Sent',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-neon-green border-neon-green/30 shadow-[0_0_5px_rgba(0,255,65,0.2)]',
      pulse: false
    },
    pending: {
      text: '! Review_Pending',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-neon-amber border-neon-amber/30 shadow-[0_0_5px_rgba(255,204,0,0.2)]',
      pulse: true
    },
    withdrawn: {
      text: 'x Withdrawn',
      className: 'glass-tag px-2 py-1 text-[10px] uppercase text-gray-400 border-gray-600',
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

const ScoreBadge = ({ score }) => {
  let colorClass = 'border-neon-green text-neon-green shadow-neon-green';

  if (score >= 90) {
    colorClass = 'border-neon-green text-neon-green shadow-neon-green';
  } else if (score >= 75) {
    colorClass = 'border-primary text-primary shadow-neon-sm';
  } else if (score >= 50) {
    colorClass = 'border-neon-amber text-neon-amber shadow-neon-amber';
  } else {
    colorClass = 'border-neon-red text-neon-red';
  }

  return (
    <div className={`inline-block px-2 py-1 border ${colorClass} text-xs font-bold`}>
      {score}%
    </div>
  );
};

const TechTag = ({ tech }) => (
  <span className="px-1.5 py-0.5 text-[10px] bg-gray-900 text-gray-400 border border-gray-700">
    [{tech}]
  </span>
);

const CandidateRow = ({ candidate }) => {
  const { name, id, role, score, techStack, status, date, time, avatar, online } = candidate;

  return (
    <tr className="group hover:bg-white/5 transition-colors">
      {/* Candidate Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative size-10">
            <img
              alt={`Candidate ${name}`}
              className="h-10 w-10 grayscale group-hover:grayscale-0 border border-gray-700 group-hover:border-primary transition-all object-cover"
              src={avatar}
            />
            {online && (
              <div className="absolute -bottom-1 -right-1 bg-black p-0.5">
                <div className="size-2 bg-neon-green shadow-neon-green" />
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">
              {name}
            </div>
            <div className="text-[10px] text-gray-500">#{id}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <div className="text-gray-300 text-xs tracking-wide">{role}</div>
      </td>

      {/* Score */}
      <td className="px-6 py-4 text-center">
        <ScoreBadge score={score} />
      </td>

      {/* Tech Stack */}
      <td className="px-6 py-4">
        <div className="flex gap-1 flex-wrap">
          {techStack.map((tech) => (
            <TechTag key={tech} tech={tech} />
          ))}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={status} />
      </td>

      {/* Timestamp */}
      <td className="px-6 py-4">
        <div className="text-gray-500 text-[10px]">
          {date} <span className="text-gray-700">|</span> {time}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <button className="p-1 text-gray-400 hover:text-primary transition-colors" title="View Profile">
            <span className="material-symbols-outlined text-[18px]">terminal</span>
          </button>
          <button className="p-1 text-gray-400 hover:text-white transition-colors" title="Edit">
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
          </button>
          <button className="p-1 text-gray-400 hover:text-neon-red transition-colors" title="Reject">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CandidateRow;
