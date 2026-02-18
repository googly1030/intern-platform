const StatusToggle = ({ enabled, onChange }) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-9 h-5 bg-gray-900 border border-gray-700 peer-focus:outline-none peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-500 after:border-gray-300 after:border after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:after:bg-primary peer-checked:after:border-primary peer-checked:shadow-neon-sm" />
      <span className={`ms-3 text-[10px] font-mono font-medium ${enabled ? 'text-primary' : 'text-gray-500'}`}>
        {enabled ? 'ENABLED' : 'DISABLED'}
      </span>
    </label>
  );
};

export default StatusToggle;
