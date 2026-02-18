import { useState } from 'react';

const ApiKeyInput = ({ label, value, placeholder, lastRotated, onTest }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      <label className="block text-xs font-mono text-primary/80 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex gap-4">
        <div className="relative flex-1 group/input">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            placeholder={placeholder}
            className="w-full bg-black border border-gray-800 text-white font-mono text-sm py-2 pl-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-800"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showKey ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
        <button
          onClick={onTest}
          className="px-4 py-2 border border-primary/50 text-primary hover:bg-primary hover:text-black font-mono text-xs uppercase tracking-wide transition-all shadow-neon-sm flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">terminal</span>
          Test_Connection
        </button>
      </div>
      {lastRotated && (
        <p className="text-[10px] text-gray-600 font-mono mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">info</span>
          Key last rotated: {lastRotated}
        </p>
      )}
    </div>
  );
};

export default ApiKeyInput;
