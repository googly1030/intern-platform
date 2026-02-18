export function Input({ label, value, onChange, placeholder, type = 'text', rows, className = '' }) {
  const inputClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl transition-all text-sm outline-none font-medium text-text-primary placeholder-slate-400 focus:border-orchid-500 focus:ring-2 focus:ring-orchid-500/10 focus:bg-white";

  return (
    <div className={`flex flex-col gap-2 group focus-within:text-orchid-500 ${className}`}>
      {label && <label className="text-sm font-semibold text-text-muted transition-colors">{label}</label>}
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          className={`${inputClasses} resize-none`}
          rows={rows}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
