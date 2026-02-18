import { useState } from 'react';

const ScoringWeights = ({ onWeightsChange }) => {
  const [weights, setWeights] = useState({
    codeQuality: 40,
    performance: 35,
    uiux: 25,
  });

  const handleChange = (key, value) => {
    const newWeights = { ...weights, [key]: parseInt(value) };
    setWeights(newWeights);
    onWeightsChange?.(newWeights);
  };

  return (
    <div className="bg-black border border-white/10 p-5 h-full">
      <h3 className="text-sm text-gray-400 font-mono mb-4 uppercase">[ Scoring Weights ]</h3>

      <div className="space-y-5">
        <div className="group">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-white group-hover:text-primary transition-colors">CODE_QUALITY</span>
            <span className="text-primary">{weights.codeQuality}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.codeQuality}
            onChange={(e) => handleChange('codeQuality', e.target.value)}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="group">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-white group-hover:text-primary transition-colors">PERFORMANCE</span>
            <span className="text-primary">{weights.performance}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.performance}
            onChange={(e) => handleChange('performance', e.target.value)}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="group">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-white group-hover:text-primary transition-colors">UI/UX_DESIGN</span>
            <span className="text-primary">{weights.uiux}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.uiux}
            onChange={(e) => handleChange('uiux', e.target.value)}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button className="bg-primary/10 border border-primary text-primary px-4 py-1.5 text-xs font-mono uppercase hover:bg-primary hover:text-black transition-all shadow-neon-sm">
            INITIALIZE_TASK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringWeights;
