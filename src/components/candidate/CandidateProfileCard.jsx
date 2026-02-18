const CandidateProfileCard = ({ candidate }) => {
  const { id, name, role, email, education, location, avatar } = candidate;

  return (
    <div className="glass-panel p-4 relative corner-brackets group">
      {/* ID Badge */}
      <div className="absolute top-0 right-0 p-1">
        <div className="text-[9px] text-primary/50 border border-primary/30 px-1">ID_{id}</div>
      </div>

      {/* Avatar & Info */}
      <div className="mb-4 relative">
        <div className="w-full aspect-square border border-primary/50 overflow-hidden relative mb-3">
          <img
            alt={name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            src={avatar}
          />
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-12" />
        </div>
        <h2 className="text-xl font-bold text-white terminal-glow">{name}</h2>
        <p className="text-xs text-primary font-mono mt-1">{role}</p>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 text-xs font-mono border-t border-white/10 pt-3">
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase text-[9px]">Contact_Ref</span>
          <span className="text-white hover:text-primary cursor-pointer truncate">{email}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase text-[9px]">Education_Node</span>
          <span className="text-white">{education}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 uppercase text-[9px]">Location_Ping</span>
          <span className="text-white">{location}</span>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileCard;
