import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionStatus, getScoreReport } from '../../services/scoringService';

const ScoringResults = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const result = await getSubmissionStatus(submissionId);
        setStatus(result);

        if (result.status === 'completed') {
          // Fetch full report
          const reportData = await getScoreReport(submissionId);
          setReport(reportData);
          setLoading(false);
        } else if (result.status === 'failed') {
          setError('Scoring failed. Please try again.');
          setLoading(false);
        }
        // Continue polling if pending or processing
      } catch (err) {
        setError(err.detail || 'Failed to fetch status');
        setLoading(false);
      }
    };

    pollStatus();

    // Poll every 2 seconds while processing
    const interval = setInterval(() => {
      if (status?.status === 'pending' || status?.status === 'processing') {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [submissionId, status?.status]);

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-400';
    if (grade.startsWith('A')) return 'text-neon-green';
    if (grade === 'B') return 'primary';
    if (grade === 'C') return 'text-neon-amber';
    return 'text-neon-red';
  };

  const getFlagIcon = (flag) => {
    const criticalFlags = ['NO_BOOTSTRAP', 'FORM_SUBMISSION_USED', 'SQL_INJECTION_RISK',
      'NO_MYSQL', 'NO_MONGODB', 'NO_REDIS', 'PHP_SESSION_USED'];
    const warningFlags = ['CODE_MIXING', 'POOR_FOLDER_STRUCTURE', 'NO_ERROR_HANDLING',
      'AI_GENERATED_HIGH', 'NO_DEPLOYMENT'];

    if (criticalFlags.includes(flag)) return { icon: '🚫', color: 'text-neon-red' };
    if (warningFlags.includes(flag)) return { icon: '⚠️', color: 'text-neon-amber' };
    return { icon: 'ℹ️', color: 'text-primary' };
  };

  if (loading && !report) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="inline-block animate-spin mb-4">
          <svg className="w-16 h-16 text-primary" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-mono text-white mb-2">
          <span className="text-primary">&gt;&gt;</span> SCORING IN PROGRESS
        </h2>
        <p className="text-gray-400 text-sm font-mono">
          Status: {status?.status || 'Initializing...'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-neon-red/50 bg-neon-red/10 p-6 text-center">
          <h2 className="text-xl font-mono text-neon-red mb-2">ERROR</h2>
          <p className="text-gray-400 text-sm font-mono">{error}</p>
          <button
            onClick={() => navigate('/submit')}
            className="mt-4 px-6 py-2 border border-white/20 text-gray-400 font-mono text-sm hover:border-white/40"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 font-mono">
            <span className="text-primary">&gt;&gt;</span> SCORE REPORT
          </h1>
          <p className="text-gray-400 text-sm font-mono">
            Submission ID: {submissionId}
          </p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-sm hover:border-white/40"
        >
          NEW SUBMISSION
        </button>
      </div>

      {/* Main Score Card */}
      <div className="border border-white/10 p-8 mb-6 text-center">
        <div className="mb-6">
          <span className={`text-6xl font-bold font-mono ${getGradeColor(report.grade)}`}>
            {report.grade || 'N/A'}
          </span>
        </div>
        <div className="mb-4">
          <span className="text-4xl font-mono text-white">{report.overallScore}</span>
          <span className="text-2xl font-mono text-gray-500">/100</span>
        </div>
        <p className="text-gray-400 text-sm font-mono">{report.recommendation}</p>
        <div className="mt-4 text-xs text-gray-500 font-mono">
          Candidate: {report.candidateName} ({report.candidateEmail})
        </div>
      </div>

      {/* AI Risk Indicator */}
      <div className="border border-white/10 p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 font-mono">AI GENERATION RISK</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  report.aiGenerationRisk <= 0.3 ? 'bg-neon-green' :
                  report.aiGenerationRisk <= 0.6 ? 'bg-neon-amber' : 'bg-neon-red'
                }`}
                style={{ width: `${report.aiGenerationRisk * 100}%` }}
              />
            </div>
            <span className={`text-sm font-mono ${
              report.aiGenerationRisk <= 0.3 ? 'text-neon-green' :
              report.aiGenerationRisk <= 0.6 ? 'text-neon-amber' : 'text-neon-red'
            }`}>
              {(report.aiGenerationRisk * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Critical Requirements */}
        <div className="border border-white/10 p-6">
          <h3 className="text-sm text-primary font-mono mb-4">
            &gt;&gt; CRITICAL REQUIREMENTS (40pts)
          </h3>
          <div className="space-y-3">
            {[
              { label: 'File Separation', key: 'fileSeparation', max: 10 },
              { label: 'jQuery AJAX', key: 'jqueryAjax', max: 10 },
              { label: 'Bootstrap', key: 'bootstrap', max: 10 },
              { label: 'Prepared Statements', key: 'preparedStatements', max: 10 },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-mono">{item.label}</span>
                <span className="text-sm font-mono">
                  <span className={report.scores?.[item.key] >= item.max * 0.7 ? 'text-neon-green' : 'text-neon-red'}>
                    {report.scores?.[item.key] || 0}
                  </span>
                  <span className="text-gray-500">/{item.max}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Implementation */}
        <div className="border border-white/10 p-6">
          <h3 className="text-sm text-neon-green font-mono mb-4">
            &gt;&gt; DATABASE (25pts)
          </h3>
          <div className="space-y-3">
            {[
              { label: 'MySQL', key: 'mysql', max: 8 },
              { label: 'MongoDB', key: 'mongodb', max: 8 },
              { label: 'Redis', key: 'redis', max: 5 },
              { label: 'localStorage', key: 'localStorage', max: 4 },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-mono">{item.label}</span>
                <span className="text-sm font-mono">
                  <span className={report.scores?.[item.key] >= item.max * 0.5 ? 'text-neon-green' : 'text-neon-red'}>
                    {report.scores?.[item.key] || 0}
                  </span>
                  <span className="text-gray-500">/{item.max}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Quality */}
        <div className="border border-white/10 p-6">
          <h3 className="text-sm text-neon-amber font-mono mb-4">
            &gt;&gt; CODE QUALITY (20pts)
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Naming Conventions', key: 'namingConventions', max: 5 },
              { label: 'Modularity', key: 'modularity', max: 5 },
              { label: 'Error Handling', key: 'errorHandling', max: 5 },
              { label: 'Security', key: 'security', max: 5 },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-mono">{item.label}</span>
                <span className="text-sm font-mono">
                  <span className={report.scores?.[item.key] >= 3 ? 'text-neon-green' : 'text-neon-amber'}>
                    {report.scores?.[item.key] || 0}
                  </span>
                  <span className="text-gray-500">/{item.max}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Structure & Extras */}
        <div className="border border-white/10 p-6">
          <h3 className="text-sm text-neon-magenta font-mono mb-4">
            &gt;&gt; STRUCTURE & EXTRAS (15pts)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 font-mono">Folder Structure</span>
              <span className="text-sm font-mono">
                <span className={report.scores?.folderStructure >= 7 ? 'text-neon-green' : 'text-neon-amber'}>
                  {report.scores?.folderStructure || 0}
                </span>
                <span className="text-gray-500">/10</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 font-mono">Deployment</span>
              <span className="text-sm font-mono">
                <span className="text-neon-green">{report.scores?.deployment || 0}</span>
                <span className="text-gray-500">/3</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 font-mono">Bonus Features</span>
              <span className="text-sm font-mono">
                <span className="text-neon-green">{report.scores?.bonusFeatures || 0}</span>
                <span className="text-gray-500">/2</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      {report.flags?.length > 0 && (
        <div className="border border-white/10 p-6 mb-6">
          <h3 className="text-sm text-neon-red font-mono mb-4">
            &gt;&gt; FLAGS
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.flags.map((flag, index) => {
              const { icon, color } = getFlagIcon(flag);
              return (
                <span
                  key={index}
                  className={`px-3 py-1 border border-white/20 text-xs font-mono ${color}`}
                >
                  {icon} {flag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-neon-green/30 p-6">
          <h3 className="text-sm text-neon-green font-mono mb-4">
            &gt;&gt; STRENGTHS
          </h3>
          <ul className="space-y-2">
            {report.strengths?.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300 font-mono">
                <span className="text-neon-green">+</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-neon-red/30 p-6">
          <h3 className="text-sm text-neon-red font-mono mb-4">
            &gt;&gt; WEAKNESSES
          </h3>
          <ul className="space-y-2">
            {report.weaknesses?.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300 font-mono">
                <span className="text-neon-red">-</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Links */}
      <div className="border border-white/10 p-4">
        <div className="flex flex-wrap gap-4 text-xs font-mono">
          <a
            href={report.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GITHUB_REPO
          </a>
          {report.hostedUrl && (
            <>
              <span className="text-gray-600">|</span>
              <a
                href={report.hostedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-green hover:underline"
              >
                LIVE_DEMO
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoringResults;
