const DecisionFooter = ({ onReject, onRequestInfo, onApprove }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-oled-black border-t border-primary/20 p-4">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Decision Mode Indicator */}
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-[20px] animate-spin"
            style={{ animationDuration: '4s' }}
          >
            settings
          </span>
          <span className="text-sm font-bold text-white uppercase tracking-widest">[ DECISION_MOD ]</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={onReject}
            className="flex-1 md:flex-none bg-black border border-neon-red/50 text-neon-red hover:bg-neon-red hover:text-black px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(255,51,51,0.2)] hover:shadow-[0_0_20px_rgba(255,51,51,0.6)] group"
          >
            <span className="group-hover:hidden">[ REJECT ]</span>
            <span className="hidden group-hover:inline">CONFIRM REJECTION</span>
          </button>

          <button
            onClick={onRequestInfo}
            className="flex-1 md:flex-none bg-black border border-neon-amber/50 text-neon-amber hover:bg-neon-amber hover:text-black px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(255,204,0,0.2)] hover:shadow-[0_0_20px_rgba(255,204,0,0.6)]"
          >
            [ REQUEST_INFO ]
          </button>

          <button
            onClick={onApprove}
            className="flex-1 md:flex-none bg-black border border-neon-green/50 text-neon-green hover:bg-neon-green hover:text-black px-12 py-3 text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] group"
          >
            <span className="group-hover:hidden">[ APPROVE ]</span>
            <span className="hidden group-hover:inline">AUTHORIZE HIRE</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default DecisionFooter;
