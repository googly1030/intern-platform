import { useState } from 'react';

const SearchFilter = ({ onSearch, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('*');
  const [score, setScore] = useState(80);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    onFilterChange?.({ status: e.target.value, score });
  };

  const handleScoreChange = (e) => {
    setScore(e.target.value);
    onFilterChange?.({ status, score: e.target.value });
  };

  return (
    <div className="mb-8 bg-black border border-primary/30 shadow-neon-sm p-1">
      <div className="flex flex-col lg:flex-row gap-4 p-4 items-center">
        {/* Search Input */}
        <div className="flex-1 w-full bg-black border-b border-white/20 flex items-center px-2 py-2 focus-within:border-primary focus-within:shadow-[0_4px_10px_-4px_rgba(0,255,255,0.5)] transition-all">
          <span className="text-primary font-mono mr-3 text-sm">root@admin:~# search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-700 font-mono text-sm p-0"
            placeholder="candidate_id --name *"
          />
          <span className="block w-2 h-4 bg-primary cursor-blink ml-2" />
        </div>

        {/* Filters */}
        <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 items-center">
          {/* Status Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-primary/70 font-mono uppercase">Status:</label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="bg-black border border-gray-700 text-white text-xs font-mono focus:ring-primary focus:border-primary block p-1.5 min-w-[120px]"
            >
              <option value="*">[*] ALL</option>
              <option value="pending">[ ] PENDING</option>
              <option value="interview">[ ] INTERVIEW</option>
              <option value="rejected">[x] REJECTED</option>
              <option value="hired">[✓] HIRED</option>
            </select>
          </div>

          {/* Score Range */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-800 bg-black/50 min-w-[180px]">
            <span className="text-[10px] text-primary font-mono">SCORE &gt;</span>
            <input
              type="range"
              min="0"
              max="100"
              value={score}
              onChange={handleScoreChange}
              className="w-full h-px bg-gray-700 appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs text-white font-mono">{score}</span>
          </div>

          {/* Export Button */}
          <button className="flex items-center justify-center p-2 border border-primary/50 text-primary hover:bg-primary hover:text-black transition-all shadow-neon-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
