const CommitHistory = ({ commits = [], totalCommits = 1240 }) => {
  // Generate default commit activity grid (36 weeks ~ 1 year)
  const generateDefaultCommits = () => {
    const levels = [0, 0.3, 0.6, 0.8, 1];
    return Array.from({ length: 36 }, () =>
      Array.from({ length: 7 }, () => levels[Math.floor(Math.random() * levels.length)])
    );
  };

  const commitData = commits.length > 0 ? commits : generateDefaultCommits();

  const getCommitColor = (level) => {
    if (level === 0) return 'bg-gray-800';
    if (level <= 0.3) return 'bg-neon-green/30';
    if (level <= 0.5) return 'bg-neon-green/50';
    if (level <= 0.7) return 'bg-neon-green/70';
    if (level <= 0.9) return 'bg-neon-green/80';
    return 'bg-neon-green';
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_HISTORY ]</h3>
      <div className="flex gap-1 flex-wrap justify-between">
        <div className="w-full grid grid-cols-12 gap-1 mb-2">
          {commitData.flat().map((level, index) => (
            <div
              key={index}
              className={`aspect-square ${getCommitColor(level)}`}
            />
          ))}
        </div>
        <div className="w-full flex justify-between text-[9px] text-gray-500 font-mono mt-1">
          <span>Less</span>
          <span>More</span>
        </div>
        <div className="w-full mt-2 text-[10px] text-center text-white">
          <span className="text-neon-green font-bold">{totalCommits.toLocaleString()}</span> commits in last year
        </div>
      </div>
    </div>
  );
};

export default CommitHistory;
