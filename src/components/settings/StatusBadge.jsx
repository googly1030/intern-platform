const StatusBadge = ({ status, label, color = 'neon-green', animate = true }) => {
  const colorClasses = {
    'neon-green': 'border-neon-green/30 bg-neon-green/10 text-neon-green',
    'neon-red': 'border-neon-red/30 bg-neon-red/10 text-neon-red',
    'neon-amber': 'border-neon-amber/30 bg-neon-amber/10 text-neon-amber',
    'primary': 'border-primary/30 bg-primary/10 text-primary',
  };

  const shadowClasses = {
    'neon-green': 'shadow-neon-green',
    'neon-red': 'shadow-[0_0_5px_rgba(255,51,51,0.5)]',
    'neon-amber': 'shadow-neon-amber',
    'primary': 'shadow-neon-sm',
  };

  return (
    <div className={`px-2 py-1 border ${colorClasses[color]} text-[10px] font-mono uppercase tracking-wider flex items-center gap-2`}>
      {animate && (
        <span className={`size-1.5 bg-${color} rounded-full animate-pulse ${shadowClasses[color]}`} />
      )}
      {label}
    </div>
  );
};

export default StatusBadge;
