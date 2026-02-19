import { useState } from 'react';

/**
 * Flag Explanations
 * Detailed explanations for each flag type
 */
const FLAG_EXPLANATIONS = {
  // Critical Flags
  NO_BOOTSTRAP: {
    severity: 'critical',
    title: 'Bootstrap Not Used',
    description: 'Bootstrap CSS framework not detected or improperly implemented',
    impact: 'Required for responsive design and consistent UI',
    fix: 'Add Bootstrap CSS via CDN: <link href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css" rel="stylesheet">',
  },
  FORM_SUBMISSION_USED: {
    severity: 'critical',
    title: 'Form Submission Instead of AJAX',
    description: 'Traditional form submissions detected instead of required jQuery AJAX',
    impact: 'Pages reload on submit, poor user experience',
    fix: 'Use $.ajax() or $.post() for form submissions instead of <form action="">',
  },
  SQL_INJECTION_RISK: {
    severity: 'critical',
    title: 'SQL Injection Vulnerability',
    description: 'Raw SQL queries detected without prepared statements',
    impact: 'SECURITY RISK: Attackers can manipulate database queries',
    fix: 'Use mysqli_prepare() or PDO with parameterized queries',
  },
  PHP_SESSION_USED: {
    severity: 'critical',
    title: 'PHP Sessions Instead of localStorage',
    description: 'Using PHP sessions for client-side state management',
    impact: 'Server-side storage used instead of required client-side storage',
    fix: 'Use localStorage.setItem() and localStorage.getItem() for session data',
  },
  NO_MYSQL: {
    severity: 'critical',
    title: 'MySQL Not Implemented',
    description: 'Required MySQL database implementation missing',
    impact: 'No relational database functionality',
    fix: 'Implement MySQL connection using mysqli or PDO',
  },
  NO_MONGODB: {
    severity: 'critical',
    title: 'MongoDB Not Implemented',
    description: 'Required MongoDB database implementation missing',
    impact: 'No NoSQL database functionality',
    fix: 'Implement MongoDB using PHP MongoDB Driver',
  },
  NO_REDIS: {
    severity: 'critical',
    title: 'Redis Not Implemented',
    description: 'Required Redis cache implementation missing',
    impact: 'No caching layer for session/performance optimization',
    fix: 'Implement Redis using predis or phpredis extension',
  },

  // Warning Flags
  CODE_MIXING: {
    severity: 'warning',
    title: 'Poor Code Separation',
    description: 'HTML, CSS, JS, and PHP mixed in same files',
    impact: 'Hard to maintain, violates separation of concerns',
    fix: 'Move CSS to .css files, JS to .js files, keep PHP logic separate',
  },
  POOR_FOLDER_STRUCTURE: {
    severity: 'warning',
    title: 'Poor Folder Structure',
    description: 'Missing required folders (css, js, php, assets)',
    impact: 'Disorganized codebase, hard to navigate',
    fix: 'Create proper folder structure: css/, js/, php/, assets/',
  },
  NO_ERROR_HANDLING: {
    severity: 'warning',
    title: 'No Error Handling',
    description: 'Missing try-catch blocks and error checking',
    impact: 'Application may crash without meaningful error messages',
    fix: 'Add try-catch blocks, validate inputs, handle edge cases',
  },
  AI_GENERATED_HIGH: {
    severity: 'warning',
    title: 'High AI Generation Risk',
    description: 'Code patterns suggest significant AI-generated content',
    impact: 'May indicate lack of original understanding',
    fix: 'Review and understand all generated code, add personal touches',
  },
  NO_DEPLOYMENT: {
    severity: 'warning',
    title: 'No Working Deployment',
    description: 'No accessible hosted URL provided',
    impact: 'Cannot verify working application',
    fix: 'Deploy to a hosting service and provide the URL',
  },
  DEPLOYMENT_NOT_ACCESSIBLE: {
    severity: 'warning',
    title: 'Deployment Not Accessible',
    description: 'Provided URL is not accessible or returns errors',
    impact: 'Cannot verify working application',
    fix: 'Ensure the deployed application is running and accessible',
  },
};

/**
 * Enhanced Flags Section
 * Shows detailed explanations for each flag
 */
const EnhancedFlags = ({ flags }) => {
  const [expandedFlag, setExpandedFlag] = useState(null);

  if (!flags || flags.length === 0) {
    return (
      <div className="border border-neon-green/30 p-4 mb-6">
        <span className="text-neon-green font-mono text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          No issues flagged
        </span>
      </div>
    );
  }

  const getFlagSeverity = (flag) => {
    const explanation = FLAG_EXPLANATIONS[flag];
    if (!explanation) {
      // Guess based on flag name
      if (flag.includes('NO_') || flag.includes('RISK') || flag.includes('INJECTION')) {
        return 'critical';
      }
      return 'warning';
    }
    return explanation.severity;
  };

  const criticalFlags = flags.filter(f => getFlagSeverity(f) === 'critical');
  const warningFlags = flags.filter(f => getFlagSeverity(f) === 'warning');

  return (
    <div className="border border-white/10 p-6 mb-6">
      <h3 className="text-sm text-neon-red font-mono mb-4">
        &gt;&gt; FLAGS ({flags.length})
      </h3>

      {/* Critical Flags */}
      {criticalFlags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-neon-red font-mono mb-2">CRITICAL</h4>
          <div className="space-y-2">
            {criticalFlags.map((flag, index) => (
              <FlagCard
                key={index}
                flag={flag}
                explanation={FLAG_EXPLANATIONS[flag]}
                isExpanded={expandedFlag === flag}
                onToggle={() => setExpandedFlag(expandedFlag === flag ? null : flag)}
                severity="critical"
              />
            ))}
          </div>
        </div>
      )}

      {/* Warning Flags */}
      {warningFlags.length > 0 && (
        <div>
          <h4 className="text-xs text-neon-amber font-mono mb-2">WARNINGS</h4>
          <div className="space-y-2">
            {warningFlags.map((flag, index) => (
              <FlagCard
                key={index}
                flag={flag}
                explanation={FLAG_EXPLANATIONS[flag]}
                isExpanded={expandedFlag === flag}
                onToggle={() => setExpandedFlag(expandedFlag === flag ? null : flag)}
                severity="warning"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Flag Card
 */
const FlagCard = ({ flag, explanation, isExpanded, onToggle, severity }) => {
  const bgColor = severity === 'critical' ? 'bg-neon-red/5' : 'bg-neon-amber/5';
  const borderColor = severity === 'critical' ? 'border-neon-red/30' : 'border-neon-amber/30';
  const textColor = severity === 'critical' ? 'text-neon-red' : 'text-neon-amber';
  const iconName = severity === 'critical' ? 'block' : 'warning';

  return (
    <div className={`border ${borderColor} ${bgColor}`}>
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between text-left"
      >
        <span className={`font-mono text-sm flex items-center gap-1 ${textColor}`}>
          <span className="material-symbols-outlined text-[16px]">{iconName}</span>
          {flag}
        </span>
        <span className="material-symbols-outlined text-[14px] text-gray-400">
          {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
      </button>

      {isExpanded && explanation && (
        <div className="px-3 pb-3 text-xs font-mono space-y-2 border-t border-white/10 pt-3">
          <div>
            <span className="text-gray-500">What:</span>{' '}
            <span className="text-gray-300">{explanation.description}</span>
          </div>
          <div>
            <span className="text-gray-500">Impact:</span>{' '}
            <span className="text-neon-amber">{explanation.impact}</span>
          </div>
          <div>
            <span className="text-gray-500">How to fix:</span>{' '}
            <span className="text-neon-green">{explanation.fix}</span>
          </div>
        </div>
      )}

      {isExpanded && !explanation && (
        <div className="px-3 pb-3 text-xs font-mono text-gray-400 border-t border-white/10 pt-3">
          No detailed explanation available for this flag.
        </div>
      )}
    </div>
  );
};

export default EnhancedFlags;
