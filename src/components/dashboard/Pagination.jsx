const Pagination = ({ currentPage = 1, totalPages = 42, onPageChange }) => {
  const pages = [1, 2, 3, '...', totalPages];

  return (
    <div className="mt-8 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
      <div className="text-xs text-primary/70">
        DISPLAYING_ROWS: <span className="text-white font-bold">1-4</span> /{' '}
        <span className="text-white font-bold">1,248</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 border border-gray-800 text-gray-500 hover:text-primary hover:border-primary transition-all disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>

        <div className="flex gap-2 text-xs">
          {pages.map((page, i) => (
            page === '...' ? (
              <span key={i} className="w-8 h-8 flex items-center justify-center text-gray-600">...</span>
            ) : (
              <button
                key={i}
                className={`w-8 h-8 flex items-center justify-center ${
                  page === currentPage
                    ? 'bg-primary text-black font-bold shadow-neon-sm'
                    : 'border border-gray-800 text-gray-400 hover:text-white hover:border-primary transition-all'
                }`}
                onClick={() => onPageChange?.(page)}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button
          className="p-2 border border-gray-800 text-gray-500 hover:text-primary hover:border-primary transition-all"
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
