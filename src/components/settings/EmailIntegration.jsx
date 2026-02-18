const EmailIntegration = ({
  provider,
  email,
  logo,
  scopes = [],
  onDisconnect
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center bg-black/40 border border-white/5 p-4">
      {/* Provider Logo */}
      <div className="size-16 flex items-center justify-center bg-white rounded-full">
        <img alt={`${provider} Logo`} className="w-10 h-10 object-contain" src={logo} />
      </div>

      {/* Connection Info */}
      <div className="flex-1 w-full text-center md:text-left">
        <h3 className="text-white font-mono font-bold">{provider}</h3>
        <p className="text-xs text-gray-500 font-mono mt-1 break-all">
          Connected as: {email}
        </p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
          {scopes.map((scope, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 border border-gray-800 text-[10px] text-gray-400 font-mono bg-black"
            >
              SCOPE: {scope}
            </span>
          ))}
        </div>
      </div>

      {/* Disconnect Button */}
      <div className="w-full md:w-auto">
        <button
          onClick={onDisconnect}
          className="w-full md:w-auto px-6 py-2 border border-neon-red/50 text-neon-red hover:bg-neon-red hover:text-black font-mono text-xs uppercase tracking-wide transition-all shadow-[0_0_5px_rgba(255,51,51,0.3)] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">link_off</span>
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default EmailIntegration;
