import { useState } from 'react';

const TemperatureSlider = ({ label, value = 0.7, min = 0, max = 1, step = 0.1, onChange }) => {
  const [tempValue, setTempValue] = useState(value);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setTempValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div>
      <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">{label}</label>
      <div className="flex items-center gap-3 h-[38px] px-3 border border-gray-800 bg-black">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={tempValue}
          onChange={handleChange}
          className="flex-1 h-1 bg-gray-800 appearance-none cursor-pointer accent-primary"
        />
        <span className="text-primary font-mono text-sm">{tempValue}</span>
      </div>
    </div>
  );
};

export default TemperatureSlider;
