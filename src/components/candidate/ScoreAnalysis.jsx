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

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono uppercase">
        <span className="text-white">{label}</span>
        <span className={textMap[color]}>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 relative overflow-hidden">
        <div
          className={`absolute h-full ${colorMap[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const ScoreAnalysis = ({ scores = [] }) => {
  const defaultScores = [
    { label: 'Frontend_Arch', value: 98, color: 'neon-green' },
    { label: 'Backend_Sys', value: 85, color: 'primary' },
    { label: 'Security_Ops', value: 72, color: 'neon-amber' },
    { label: 'Algorithmic_Eff', value: 91, color: 'secondary' },
  ];

  const skillScores = scores.length > 0 ? scores : defaultScores;

  return (
    <div className="glass-panel p-1 min-h-[300px] flex flex-col">
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
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Radar Chart Placeholder */}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
          {/* Concentric circles */}
          <div className="absolute inset-0 border border-primary/20 rounded-full" />
          <div className="absolute inset-[15%] border border-primary/20 rounded-full" />
          <div className="absolute inset-[30%] border border-primary/20 rounded-full" />
          <div className="absolute inset-[45%] border border-primary/20 rounded-full" />

          {/* Cross lines */}
          <div className="absolute w-full h-px bg-primary/20 top-1/2 left-0" />
          <div className="absolute h-full w-px bg-primary/20 left-1/2 top-0" />
          <div className="absolute w-full h-px bg-primary/20 top-1/2 left-0 rotate-45" />
          <div className="absolute h-full w-px bg-primary/20 left-1/2 top-0 rotate-45" />

          {/* Radar polygon */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
            <polygon
              className="fill-primary/20 stroke-primary stroke-[1.5] drop-shadow-[0_0_5px_rgba(0,255,255,0.6)] animate-pulse"
              points="50,10 85,35 75,80 25,80 15,35"
              style={{ animationDuration: '3s' }}
            />
          </svg>

          {/* Labels */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-full text-[9px] text-white">Frontend</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-full text-[9px] text-white">Backend</span>
          <span className="absolute top-1/2 right-2 translate-x-full -translate-y-1/2 text-[9px] text-white">DevOps</span>
          <span className="absolute top-1/2 left-2 -translate-x-full -translate-y-1/2 text-[9px] text-white">Security</span>
        </div>

        {/* Skill Bars */}
        <div className="space-y-4 w-full">
          {skillScores.map((score, index) => (
            <SkillBar key={index} label={score.label} value={score.value} color={score.color} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreAnalysis;
