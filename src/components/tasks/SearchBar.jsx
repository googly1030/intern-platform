import { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="bg-black border border-primary/30 shadow-neon-sm p-1">
      <div className="flex items-center px-2 py-1 bg-black border-b border-white/10 focus-within:border-primary transition-colors">
        <span className="text-primary font-mono mr-2 text-sm select-none">grep</span>
        <span className="text-gray-500 font-mono mr-2 text-sm select-none">-r</span>
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          className="bg-transparent border-none text-white w-full focus:ring-0 placeholder-gray-700 font-mono text-sm p-0"
          placeholder='"task_name" ./tasks'
        />
        <span className="block w-2 h-4 bg-primary cursor-blink ml-2" />
      </div>
    </div>
  );
};

export default SearchBar;
