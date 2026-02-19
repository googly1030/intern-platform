const CandidateProfileCard = ({ candidate }) => {
  const {
    id,
    name,
    role,
    email,
    education,
    location,
    avatar,
    grade,
    overall_score,
    status
  } = candidate;

  // Generate initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get grade color
  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade === 'A+' || grade === 'A') return 'text-neon-green';
    if (grade === 'B') return 'text-primary';
    if (grade === 'C') return 'text-neon-amber';
    return 'text-neon-red';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-neon-green';
      case 'processing': return 'text-primary';
      case 'pending': return 'text-neon-amber';
      case 'failed': return 'text-neon-red';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="glass-panel p-4 relative corner-brackets group">
      {/* ID Badge */}
      <div className="absolute top-0 right-0 p-1">
        <div className="text-[9px] text-primary/50 border border-primary/30 px-1">ID_{id?.slice(0, 8) || '---'}</div>
      </div>

      {/* Avatar & Info */}
      <div className="mb-4 relative">
        <div className="w-full aspect-square border border-primary/50 overflow-hidden relative mb-3 flex items-center justify-center bg-gray-900">
          {avatar ? (
            <img
              alt={name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              src={avatar}
            />
          ) : (
            <span className="text-4xl font-bold text-primary">{getInitials(name)}</span>
          )}
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-12" />
        </div>
        <h2 className="text-xl font-bold text-white terminal-glow">{name || 'Unknown'}</h2>
        <p className="text-xs text-primary font-mono mt-1">{role || 'Candidate'}</p>

        {/* Grade & Score */}
        {(grade || overall_score !== undefined) && (
          <div className="mt-3 flex items-center gap-3">
            {grade && (
              <div className={`text-2xl font-bold ${getGradeColor(grade)}`}>
                {grade}
              </div>
            )}
            {overall_score !== undefined && overall_score !== null && (
              <div className="text-gray-400 text-sm">
                {overall_score}/100
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {status && (
          <div className={`mt-2 text-xs font-mono uppercase ${getStatusColor(status)}`}>
            ● {status}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-3 text-xs font-mono border-t border-white/10 pt-3">
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase text-[9px]">Contact_Ref</span>
          <a
            href={`mailto:${email}`}
            className="text-white hover:text-primary cursor-pointer truncate flex items-center gap-1"
          >
            {email || 'N/A'}
            <span className="material-symbols-outlined text-[12px]">mail</span>
          </a>
        </div>
        {education && (
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[9px]">Education_Node</span>
            <span className="text-white">{education}</span>
          </div>
        )}
        {location && (
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase text-[9px]">Location_Ping</span>
            <span className="text-white">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateProfileCard;
