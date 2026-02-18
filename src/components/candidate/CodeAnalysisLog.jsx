const CodeAnalysisLog = ({ logs = [] }) => {
  const defaultLogs = [
    { time: '14:20:01', type: 'INFO', message: 'Initiating static code analysis...' },
    { time: '14:20:02', type: 'INFO', message: 'Scanning repositories: 12 identified.' },
    { time: '14:20:05', type: 'PASS', message: 'Clean architecture pattern detected in /core/services', highlight: '/core/services' },
    { time: '14:20:08', type: 'WARN', message: 'High cyclomatic complexity in auth_provider.ts (score: 14)', highlight: 'auth_provider.ts (score: 14)', highlightColor: 'secondary' },
    { time: '14:20:12', type: 'PASS', message: 'Unit test coverage: 94.2%', highlight: '94.2%', highlightColor: 'neon-green' },
    { time: '14:20:15', type: 'PASS', message: 'No hardcoded credentials found.' },
    { time: '14:20:18', type: 'INFO', message: 'Analysis complete. Generating digest...', cursor: true },
  ];

  const logEntries = logs.length > 0 ? logs : defaultLogs;

  const getTypeColor = (type) => {
    switch (type) {
      case 'PASS': return 'text-neon-green';
      case 'WARN': return 'text-neon-amber';
      case 'ERROR': return 'text-neon-red';
      default: return 'text-blue-400';
    }
  };

  const renderMessage = (log) => {
    if (!log.highlight) {
      return <span className="text-white">{log.message}</span>;
    }

    const parts = log.message.split(log.highlight);
    const highlightClass = log.highlightColor === 'secondary' ? 'text-secondary' :
                           log.highlightColor === 'neon-green' ? 'text-neon-green' : 'text-primary';

    return (
      <span className="text-white">
        {parts[0]}
        <span className={highlightClass}>{log.highlight}</span>
        {parts[1]}
        {log.cursor && <span className="cursor" />}
      </span>
    );
  };

  return (
    <div className="glass-panel flex-1 flex flex-col min-h-[300px] border-t-2 border-t-primary">
      {/* Header */}
      <div className="bg-oled-black/80 px-4 py-2 flex justify-between items-center border-b border-white/10">
        <span className="text-xs text-primary font-mono uppercase tracking-widest">[ CODE_ANALYSIS_REPORT ]</span>
        <span className="text-[10px] text-gray-500 font-mono">log_tail -f /var/audit/code.log</span>
      </div>

      {/* Log Content */}
      <div className="flex-1 bg-black/50 p-4 overflow-y-auto font-mono text-xs relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
        <div className="space-y-1.5">
          {logEntries.map((log, index) => (
            <div key={index} className="flex gap-2 text-gray-500">
              <span>[{log.time}]</span>
              <span className={getTypeColor(log.type)}>{log.type}</span>
              {renderMessage(log)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodeAnalysisLog;
