const SettingsSection = ({ title, subtitle, icon, statusBadge, children, gradient = false }) => {
  return (
    <section className={`relative group ${gradient ? '' : ''}`}>
      {gradient && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/20 rounded-sm blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      )}
      <div className="relative bg-oled-black border border-primary/30 p-1 shadow-neon-sm">
        <div className="bg-oled-gray/50 p-6 relative overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-mono font-bold text-primary terminal-glow flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-gray-500 font-mono mt-1">{subtitle}</p>
              )}
            </div>
            {statusBadge}
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </section>
  );
};

export default SettingsSection;
