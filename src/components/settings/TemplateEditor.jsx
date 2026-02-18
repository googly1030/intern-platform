import { useState } from 'react';

const TemplateEditor = ({
  label,
  subject,
  icon,
  color = 'primary',
  value,
  onChange,
  onPreview
}) => {
  const colorClasses = {
    'neon-green': 'text-neon-green',
    'neon-red': 'text-neon-red',
    'neon-amber': 'text-neon-amber',
    'primary': 'text-primary',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className={`text-xs font-mono ${colorClasses[color]} uppercase tracking-wide flex items-center gap-2`}>
          <span className="material-symbols-outlined text-[14px]">{icon}</span>
          {label}
        </label>
        <button
          onClick={onPreview}
          className="text-[10px] text-primary hover:text-white underline decoration-dashed"
        >
          Preview
        </button>
      </div>

      <div className="bg-[#050505] border border-gray-800 flex flex-col h-64 group-focus-within:border-primary/50 transition-colors">
        {/* Editor Header */}
        <div className="bg-gray-900/50 px-3 py-1 border-b border-gray-800 flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-mono">subject: {subject}</span>
          <span className="text-[10px] text-gray-600 font-mono">HTML</span>
        </div>

        {/* Editor Content */}
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 w-full bg-transparent border-none text-gray-300 font-mono text-xs p-3 focus:ring-0 resize-none code-editor"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default TemplateEditor;
