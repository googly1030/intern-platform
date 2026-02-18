const DifficultyIndicator = ({ level }) => {
  const config = {
    easy: { bars: 1, color: 'bg-neon-green', textColor: 'text-neon-green', label: 'EASY' },
    medium: { bars: 2, color: 'bg-neon-amber', textColor: 'text-neon-amber', label: 'MED' },
    hard: { bars: 3, color: 'bg-neon-red', textColor: 'text-neon-red', label: 'HARD' },
  };

  const { bars, color, textColor, label } = config[level] || config.medium;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-6 ${i <= bars ? color : 'bg-gray-800'}`}
        />
      ))}
      <span className={`ml-2 text-[10px] ${textColor}`}>{label}</span>
    </div>
  );
};

export default DifficultyIndicator;
