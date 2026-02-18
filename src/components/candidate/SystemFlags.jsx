const SystemFlags = ({ flags = [] }) => {
  const defaultFlags = [
    {
      type: 'error',
      icon: 'security',
      title: 'Security Risk',
      description: "Old dependency in 2021 project (CVE-2021-44228)",
    },
    {
      type: 'warning',
      icon: 'speed',
      title: 'Performance',
      description: 'Frontend bundle size > 2MB on initial load',
    },
  ];

  const systemFlags = flags.length > 0 ? flags : defaultFlags;

  const getFlagStyles = (type) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-neon-red/10 border-neon-red/30',
          icon: 'text-neon-red',
          border: 'border-neon-red',
        };
      case 'warning':
        return {
          container: 'bg-neon-amber/10 border-neon-amber/30',
          icon: 'text-neon-amber',
          border: 'border-neon-amber',
        };
      default:
        return {
          container: 'bg-primary/10 border-primary/30',
          icon: 'text-primary',
          border: 'border-primary',
        };
    }
  };

  return (
    <div className="glass-panel p-1">
      <div className={`${systemFlags.some(f => f.type === 'error') ? 'bg-neon-red/10 border-neon-red/30' : 'bg-neon-amber/10 border-neon-amber/30'} border p-3`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`${
            systemFlags.some(f => f.type === 'error') ? 'text-neon-red' : 'text-neon-amber'
          } text-xs font-bold uppercase tracking-widest flex items-center gap-2`}>
            <span className="material-symbols-outlined text-[16px]">warning</span>
            SYSTEM_FLAGS ({systemFlags.length})
          </h4>
        </div>

        <div className="space-y-2">
          {systemFlags.map((flag, index) => {
            const styles = getFlagStyles(flag.type);
            return (
              <div key={index} className={`flex items-start gap-2 bg-black/40 p-2 border-l-2 ${styles.border}`}>
                <span className={`material-symbols-outlined ${styles.icon} text-[14px] mt-0.5`}>
                  {flag.icon}
                </span>
                <div>
                  <div className="text-[10px] text-white font-bold">{flag.title}</div>
                  <div className="text-[9px] text-gray-400">{flag.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemFlags;
