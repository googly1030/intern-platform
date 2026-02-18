const ProgressDots = ({ filled = 4, total = 5, color = 'neon-green' }) => (
  <div className="flex gap-1 mt-4">
    {[...Array(total)].map((_, i) => (
      <span
        key={i}
        className={`h-1 w-1 ${i < filled ? `bg-${color}` : 'bg-gray-800'}`}
      />
    ))}
  </div>
);

export default ProgressDots;
