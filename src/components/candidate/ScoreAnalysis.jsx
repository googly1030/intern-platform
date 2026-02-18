// Max points for each category
const MAX_SCORES = {
  'Folder_Structure': 10,
  'File_Separation': 10,
  'jQuery_AJAX': 10,
  'Bootstrap': 10,
  'Prepared_Stmts': 10,
  'Database_Usage': 21,  // MySQL(8) + MongoDB(8) + Redis(5)
  'LocalStorage': 4,
  'Security': 5,
  'Code_Quality': 20,  // AI review scores
  'Deployment': 3,
};

const SkillBar = ({ label, value, color = 'primary' }) => {
  const colorMap = {
    'primary': 'bg-primary shadow-[0_0_5px_#00ffff]',
    'neon-green': 'bg-neon-green shadow-[0_0_5px_#00ff41]',
    'neon-amber': 'bg-neon-amber shadow-[0_0_5px_#ffcc00]',
    'secondary': 'bg-secondary shadow-[0_0_5px_#ff00ff]',
    'neon-red': 'bg-neon-red shadow-[0_0_5px_#ff3333]',
  };

  const textMap = {
    'primary': 'text-primary',
    'neon-green': 'text-neon-green',
    'neon-amber': 'text-neon-amber',
    'secondary': 'text-secondary',
    'neon-red': 'text-neon-red',
  };

  const maxScore = MAX_SCORES[label] || 10;
  const percentage = Math.round((value / maxScore) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono uppercase">
        <span className="text-white">{label}</span>
        <span className={textMap[color]}>{value}/{maxScore}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 relative overflow-hidden">
        <div
          className={`absolute h-full ${colorMap[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Grade color helper
const getGradeStyle = (grade) => {
  if (!grade) return { text: 'text-gray-500', border: 'border-gray-600', bg: 'bg-gray-800' };
  if (grade === 'A+') return { text: 'text-neon-green', border: 'border-neon-green', bg: 'bg-neon-green/20' };
  if (grade === 'A') return { text: 'text-primary', border: 'border-primary', bg: 'bg-primary/20' };
  if (grade === 'B') return { text: 'text-neon-amber', border: 'border-neon-amber', bg: 'bg-neon-amber/20' };
  return { text: 'text-neon-red', border: 'border-neon-red', bg: 'bg-neon-red/20' };
};

// Score color based on value
const getScoreColor = (score) => {
  if (score >= 80) return 'text-neon-green';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-neon-amber';
  return 'text-neon-red';
};

const ScoreAnalysis = ({ scores = [], overallScore, grade }) => {
  const defaultScores = [
    { label: 'Frontend_Arch', value: 98, color: 'neon-green' },
    { label: 'Backend_Sys', value: 85, color: 'primary' },
    { label: 'Security_Ops', value: 72, color: 'neon-amber' },
    { label: 'Algorithmic_Eff', value: 91, color: 'secondary' },
  ];

  const skillScores = scores.length > 0 ? scores : defaultScores;
  const gradeStyle = getGradeStyle(grade);
  const scoreColor = getScoreColor(overallScore || 0);

  return (
    <div className="glass-panel p-1 flex flex-col shrink-0">
      {/* Header */}
      <div className="bg-oled-black/80 px-4 py-2 flex justify-between items-center border-b border-white/10">
        <span className="text-xs text-primary font-mono uppercase tracking-widest">[ SCORE_ANALYSIS ]</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-gray-700" />
          <div className="w-2 h-2 rounded-full bg-gray-700" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* Grade & Overall Score - Enhanced UI */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center lg:w-48 p-5 border border-white/10 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-primary blur-3xl" />
          </div>

          {/* Score circle */}
          {overallScore !== undefined && overallScore !== null ? (
            <>
              <div className="relative">
                {/* Outer ring */}
                <div className={`w-28 h-28 rounded-full border-4 ${gradeStyle.border} flex items-center justify-center relative`}>
                  {/* Inner glow */}
                  <div className="absolute inset-2 rounded-full border border-white/10" />

                  {/* Score text */}
                  <div className="text-center relative z-10">
                    <div className={`text-4xl font-bold ${scoreColor} terminal-glow leading-none`}>
                      {overallScore}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">/ 100</div>
                  </div>
                </div>

                {/* Score percentage arc indicator */}
                <svg className="absolute inset-0 w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(overallScore / 100) * 289} 289`}
                    className={scoreColor.replace('text-', 'text-')}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Grade badge */}
              {grade && (
                <div className={`mt-4 px-5 py-2 border-2 ${gradeStyle.border} ${gradeStyle.bg} relative`}>
                  <span className={`text-sm font-bold tracking-wider ${gradeStyle.text}`}>
                    GRADE {grade}
                  </span>
                  {/* Corner decorations */}
                  <div className={`absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 ${gradeStyle.border}`} />
                  <div className={`absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 ${gradeStyle.border}`} />
                  <div className={`absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 ${gradeStyle.border}`} />
                  <div className={`absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 ${gradeStyle.border}`} />
                </div>
              )}

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${overallScore >= 70 ? 'bg-neon-green' : overallScore >= 50 ? 'bg-neon-amber' : 'bg-neon-red'} ${overallScore >= 70 ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {overallScore >= 80 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Average' : 'Needs Work'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm">No score</div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-white/10 flex-shrink-0" />
        <div className="lg:hidden h-px w-full bg-white/10" />

        {/* Skill Bars */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 min-w-0">
          {skillScores.map((score, index) => (
            <SkillBar key={index} label={score.label} value={score.value} color={score.color} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreAnalysis;
