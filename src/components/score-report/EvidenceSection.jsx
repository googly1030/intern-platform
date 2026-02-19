/**
 * Evidence Section
 * Shows what technologies/code patterns were detected
 */
const EvidenceSection = ({ analysisDetails, githubUrl }) => {
  if (!analysisDetails) return null;

  const databases = analysisDetails.databases || {};
  const security = analysisDetails.security || {};

  const detections = [
    {
      category: 'MySQL',
      detected: databases.mysql?.detected,
      evidence: databases.mysql?.evidence || [],
      score: databases.mysql?.score,
    },
    {
      category: 'MongoDB',
      detected: databases.mongodb?.detected,
      evidence: databases.mongodb?.evidence || [],
      score: databases.mongodb?.score,
    },
    {
      category: 'Redis',
      detected: databases.redis?.detected,
      evidence: databases.redis?.evidence || [],
      score: databases.redis?.score,
    },
    {
      category: 'localStorage',
      detected: analysisDetails.localStorage?.detected,
      evidence: analysisDetails.localStorage?.evidence || [],
      score: analysisDetails.localStorage?.score,
    },
  ];

  const securityChecks = [
    {
      label: 'Password Hashing',
      detected: security.password_hashing,
      good: security.password_hashing,
    },
    {
      label: 'Input Sanitization',
      detected: security.input_sanitization,
      good: security.input_sanitization,
    },
  ];

  return (
    <div className="border border-white/10 p-6 mb-6">
      <h3 className="text-sm text-neon-green font-mono mb-4">
        &gt;&gt; DETECTION EVIDENCE
      </h3>

      {/* Database Detections */}
      <div className="mb-6">
        <h4 className="text-xs text-gray-400 font-mono mb-3">DATABASES</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detections.map((item, index) => (
            <div
              key={index}
              className={`p-3 border ${
                item.detected
                  ? 'border-neon-green/30 bg-neon-green/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-sm flex items-center gap-1 ${item.detected ? 'text-neon-green' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">{item.detected ? 'check_circle' : 'cancel'}</span>
                  {item.category}
                </span>
                {item.score !== undefined && (
                  <span className="text-xs text-gray-400">{item.score}/8</span>
                )}
              </div>
              {item.detected && item.evidence.length > 0 && (
                <div className="text-xs text-gray-400 font-mono">
                  <span className="text-gray-500">Evidence:</span>{' '}
                  {item.evidence.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Checks */}
      <div>
        <h4 className="text-xs text-gray-400 font-mono mb-3">SECURITY</h4>
        <div className="grid grid-cols-2 gap-3">
          {securityChecks.map((item, index) => (
            <div
              key={index}
              className={`p-3 border ${
                item.good
                  ? 'border-neon-green/30'
                  : 'border-neon-red/30 bg-neon-red/5'
              }`}
            >
              <span className={`font-mono text-sm flex items-center gap-1 ${item.good ? 'text-neon-green' : 'text-neon-red'}`}>
                <span className="material-symbols-outlined text-[16px]">{item.good ? 'check_circle' : 'cancel'}</span>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvidenceSection;
