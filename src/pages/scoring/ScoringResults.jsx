import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionStatus, getScoreReport, subscribeToProgress } from '../../services/scoringService';
import { CodeMetrics, EvidenceSection, ScoreDeductions, EnhancedFlags, InterviewQuestions, UISnapshotsSection } from '../../components/score-report';

const ScoringResults = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    stage: 'initializing',
    progress: 0,
    message: 'Initializing...',
  });

  // Handle progress updates from WebSocket
  const handleProgressUpdate = useCallback((data) => {
    console.log('[Progress]', data);
    setProgress({
      stage: data.stage || 'processing',
      progress: data.progress || 0,
      message: data.message || 'Processing...',
    });

    // If completed, fetch the full report
    if (data.done) {
      fetchReport();
    }

    // If failed, show error
    if (data.error) {
      setError(data.message || 'Scoring failed');
      setLoading(false);
    }
  }, []);

  // Fetch the full score report
  const fetchReport = useCallback(async () => {
    try {
      const reportData = await getScoreReport(submissionId);
      setReport(reportData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      // Fallback: try to get at least the status
      try {
        const statusResult = await getSubmissionStatus(submissionId);
        if (statusResult.status === 'failed') {
          setError(statusResult.error_message || 'Scoring failed');
        } else {
          setError('Failed to fetch results');
        }
      } catch (statusErr) {
        setError('Failed to fetch results');
      }
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    let unsubscribe = null;
    let pollInterval = null;
    let mounted = true;

    const initialize = async () => {
      try {
        // Get initial status
        const result = await getSubmissionStatus(submissionId);

        if (!mounted) return;

        if (result.status === 'completed') {
          // Already completed, fetch report
          fetchReport();
        } else if (result.status === 'failed') {
          setError(result.error_message || 'Scoring failed');
          setLoading(false);
        } else {
          // Subscribe to WebSocket for real-time updates
          unsubscribe = subscribeToProgress(submissionId, handleProgressUpdate);

          // Also poll as fallback
          pollInterval = setInterval(async () => {
            try {
              const statusResult = await getSubmissionStatus(submissionId);

              if (!mounted) return;

              if (statusResult.status === 'completed') {
                clearInterval(pollInterval);
                fetchReport();
              } else if (statusResult.status === 'failed') {
                clearInterval(pollInterval);
                setError(statusResult.error_message || 'Scoring failed');
                setLoading(false);
              }
            } catch (err) {
              console.error('Polling error:', err);
            }
          }, 3000);
        }
      } catch (err) {
        setError(err.detail || 'Failed to fetch status');
        setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (unsubscribe) unsubscribe();
    };
  }, [submissionId, handleProgressUpdate, fetchReport]);

  // Get stage display info
  const getStageInfo = (stage) => {
    const stages = {
      initializing: { label: 'Initializing', icon: 'settings', color: 'text-gray-400' },
      cloning: { label: 'Cloning Repository', icon: 'folder_zip', color: 'text-primary' },
      analyzing: { label: 'Analyzing Code', icon: 'search', color: 'text-neon-amber' },
      ai_review: { label: 'AI Review', icon: 'smart_toy', color: 'text-neon-magenta' },
      ai_detection: { label: 'AI Detection', icon: 'radar', color: 'text-neon-amber' },
      deployment: { label: 'Checking Deployment', icon: 'cloud', color: 'text-neon-green' },
      scoring: { label: 'Calculating Scores', icon: 'analytics', color: 'text-primary' },
      completed: { label: 'Completed', icon: 'check_circle', color: 'text-neon-green' },
      failed: { label: 'Failed', icon: 'error', color: 'text-neon-red' },
    };
    return stages[stage] || { label: stage, icon: 'hourglass_empty', color: 'text-gray-400' };
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-400';
    if (grade.startsWith('A')) return 'text-neon-green';
    if (grade === 'B') return 'primary';
    if (grade === 'C') return 'text-neon-amber';
    return 'text-neon-red';
  };

  if (loading && !report) {
    const stageInfo = getStageInfo(progress.stage);

    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        {/* Stage Icon */}
        <div className="text-6xl mb-4">
          <span className={`material-symbols-outlined text-[64px] ${stageInfo.color}`}>{stageInfo.icon}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 font-mono">{progress.progress}%</span>
            <span className="text-xs text-gray-500 font-mono">{progress.stage}</span>
          </div>
        </div>

        <h2 className={`text-xl font-mono mb-2 ${stageInfo.color}`}>
          <span className="text-primary">&gt;&gt;</span> {stageInfo.label.toUpperCase()}
        </h2>
        <p className="text-gray-400 text-sm font-mono mb-6">
          {progress.message}
        </p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100" />
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200" />
        </div>

        {/* Processing Steps */}
        <div className="mt-8 border border-white/10 p-4">
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {['cloning', 'analyzing', 'ai_review', 'scoring'].map((s, i) => {
              const isActive = progress.stage === s;
              const isComplete = ['completed'].includes(progress.stage) ||
                (progress.stage === 'scoring' && i < 3) ||
                (progress.stage === 'ai_review' && i < 2) ||
                (progress.stage === 'analyzing' && i < 1);
              return (
                <div
                  key={s}
                  className={`py-2 px-1 ${
                    isActive ? 'bg-primary/20 text-primary border border-primary' :
                    isComplete ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
                    'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  {s.replace('_', ' ').toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission ID */}
        <p className="mt-6 text-xs text-gray-600 font-mono">
          ID: {submissionId}
        </p>
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

      {/* NEW: Score Deductions - Why marks were lost */}
      <ScoreDeductions
        analysisDetails={report.analysisDetails}
        scores={report.scores}
        githubUrl={report.githubUrl}
      />

      {/* NEW: Code Metrics */}
      <CodeMetrics
        analysisDetails={report.analysisDetails}
        scores={report.scores}
      />

      {/* NEW: Evidence Section */}
      <EvidenceSection
        analysisDetails={report.analysisDetails}
        githubUrl={report.githubUrl}
      />

      {/* NEW: Enhanced Flags with explanations */}
      <EnhancedFlags flags={report.flags} />

      {/* NEW: Interview Questions based on weaknesses */}
      <InterviewQuestions report={report} />

      {/* NEW: UI Snapshots */}
      <UISnapshotsSection screenshots={report.screenshots} hostedUrl={report.hostedUrl} />

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-neon-green/30 p-6">
          <h3 className="text-sm text-neon-green font-mono mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">thumb_up</span>
            &gt;&gt; STRENGTHS
          </h3>
          <ul className="space-y-2">
            {report.strengths?.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300 font-mono">
                <span className="material-symbols-outlined text-[14px] text-neon-green">add</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-neon-red/30 p-6">
          <h3 className="text-sm text-neon-red font-mono mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            &gt;&gt; WEAKNESSES
          </h3>
          <ul className="space-y-2">
            {report.weaknesses?.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300 font-mono">
                <span className="material-symbols-outlined text-[14px] text-neon-red">remove</span>
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
