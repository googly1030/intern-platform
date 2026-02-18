const ProgressBar = ({ value = 65, color = 'neon-amber' }) => {
  const colorMap = {
    'neon-amber': 'bg-neon-amber shadow-neon-amber',
    'neon-green': 'bg-neon-green shadow-neon-green',
    'primary': 'bg-primary shadow-neon-sm'
  };

  return (
    <div className="mt-4 w-full bg-gray-900 h-0.5 overflow-hidden">
      <div
        className={`h-full ${colorMap[color]}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export default ProgressBar;
