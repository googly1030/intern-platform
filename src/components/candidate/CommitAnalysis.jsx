import { useState, useEffect } from 'react';
import api from '../../services/api';

const CommitAnalysis = ({ githubUrl, submissionId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (githubUrl && submissionId) {
      fetchAnalysis();
    } else {
      setLoading(false);
    }
  }, [githubUrl, submissionId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/submissions/${submissionId}/commit-analysis`);
      setAnalysis(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch commit analysis:', err);
      setError('Failed to analyze commits');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score > 0.7) return 'text-neon-red';
    if (score > 0.4) return 'text-neon-amber';
    return 'text-neon-green';
  };

  const getRiskBg = (score) => {
    if (score > 0.7) return 'bg-neon-red/20 border-neon-red/40';
    if (score > 0.4) return 'bg-neon-amber/20 border-neon-amber/40';
    return 'bg-neon-green/20 border-neon-green/40';
  };

  const getFactorStyle = (contribution) => {
    if (contribution > 0.15) return 'border-neon-red/40 bg-neon-red/10';
    if (contribution > 0.08) return 'border-neon-amber/40 bg-neon-amber/10';
    return 'border-white/10 bg-white/5';
  };

  // Calculate risk factors for display
  const calculateRiskFactors = () => {
    if (!analysis) return [];

    const factors = [];
    const totalCommits = analysis.total_commits || 0;
    const patterns = analysis.commit_patterns || {};
    const timeline = analysis.timeline_analysis || {};
    const aiRiskScore = analysis.ai_risk_score || 0;

    // Factor 1: AI Pattern Matches
    const aiMatchRatio = totalCommits > 0 ? patterns.ai_pattern_matches / totalCommits : 0;
    if (aiMatchRatio > 0) {
      factors.push({
        name: 'Generic Commit Messages',
        value: `${patterns.ai_pattern_matches}/${totalCommits} commits`,
        contribution: Math.round(aiMatchRatio * 25),
        description: 'Messages matching AI patterns like "Update file.py", "Fix bug", "Initial commit"',
        icon: 'edit_note',
        details: patterns.common_patterns ? Object.keys(patterns.common_patterns).map(p => p.replace(/\^|\\/g, '')).join(', ') : null
      });
    }

    // Factor 2: Short Messages
    const shortRatio = totalCommits > 0 ? patterns.short_messages / totalCommits : 0;
    if (shortRatio > 0) {
      factors.push({
        name: 'Short Commit Messages',
        value: `${patterns.short_messages} commits under 15 chars`,
        contribution: Math.round(shortRatio * 15),
        description: 'Very short messages (<15 chars) are common in AI-generated or rushed commits',
        icon: 'short_text',
        details: `Average length: ${Math.round(patterns.avg_message_length || 0)} characters`
      });
    }

    // Factor 3: Commit Frequency
    const commitsPerDay = timeline.commits_per_day || 0;
    if (commitsPerDay > 3) {
      factors.push({
        name: 'High Commit Frequency',
        value: `${commitsPerDay.toFixed(1)} commits/day`,
        contribution: commitsPerDay > 5 ? 20 : 10,
        description: 'High commits per day may indicate bulk uploading or copy-paste behavior',
        icon: 'speed',
        details: `${totalCommits} commits in ${Math.round(timeline.total_days || 1)} day(s)`
      });
    }

    // Factor 4: Bulk Sessions
    const bulkSessions = timeline.bulk_commit_sessions || 0;
    if (bulkSessions > 0) {
      factors.push({
        name: 'Rapid Commit Sessions',
        value: `${bulkSessions} sessions detected`,
        contribution: Math.min(15, bulkSessions * 3),
        description: 'Multiple commits within 1 hour suggests batch uploads or AI generation',
        icon: 'stack',
        details: '3+ commits within 1 hour = 1 rapid session'
      });
    }

    // Factor 5: Project Duration
    const totalDays = timeline.total_days || 0;
    if (totalDays < 1 && totalCommits > 5) {
      factors.push({
        name: 'Single-Day Project',
        value: 'All commits in < 24 hours',
        contribution: 25,
        description: 'Complete project in one day with many commits is suspicious',
        icon: 'timer',
        details: 'Consider verifying understanding during interview'
      });
    } else if (totalDays < 3 && totalCommits > 10) {
      factors.push({
        name: 'Short Development Time',
        value: `${Math.round(totalDays)} days for ${totalCommits} commits`,
        contribution: 15,
        description: 'High velocity may indicate pre-written or AI-generated code',
        icon: 'schedule',
        details: null
      });
    }

    // Factor 6: Single Author (info only)
    const authorAnalysis = analysis.author_analysis || {};
    if (authorAnalysis.single_author) {
      factors.push({
        name: 'Single Contributor',
        value: '1 author only',
        contribution: 0,
        description: 'No collaboration - typical for intern projects but worth noting',
        icon: 'person',
        details: authorAnalysis.author_commits ? Object.keys(authorAnalysis.author_commits)[0] : null
      });
    }

    // Sort by contribution (highest first)
    factors.sort((a, b) => b.contribution - a.contribution);

    return factors;
  };

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_ANALYSIS ]</h3>
        <div className="flex items-center justify-center py-4">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        </div>
      </div>
    );
  }

  if (error || !githubUrl) {
    return (
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_ANALYSIS ]</h3>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <span className="material-symbols-outlined text-2xl text-gray-600 mb-2">psychology_alt</span>
          <p className="text-gray-500 font-mono text-[10px]">
            {error || 'NO GITHUB URL'}
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const aiRiskScore = analysis.ai_risk_score || 0;
  const findings = analysis.findings || [];
  const recommendations = analysis.recommendations || [];
  const riskFactors = calculateRiskFactors();

  return (
    <div className="glass-panel p-4">
      <h3 className="text-xs font-bold text-primary uppercase mb-3">[ COMMIT_ANALYSIS ]</h3>

      {/* AI Risk Score Header */}
      <div className={`border p-3 mb-4 ${getRiskBg(aiRiskScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-400 font-mono uppercase">AI Generation Risk</span>
          <span className={`text-lg font-bold ${getRiskColor(aiRiskScore)}`}>
            {Math.round(aiRiskScore * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              aiRiskScore > 0.7 ? 'bg-neon-red' :
              aiRiskScore > 0.4 ? 'bg-neon-amber' : 'bg-neon-green'
            }`}
            style={{ width: `${aiRiskScore * 100}%` }}
          />
        </div>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="mb-4">
        <p className="text-[10px] text-gray-400 font-mono uppercase mb-2">
          <span className="material-symbols-outlined text-[12px] align-middle mr-1">analytics</span>
          Why This Score?
        </p>
        <div className="space-y-2">
          {riskFactors.map((factor, index) => (
            <div
              key={index}
              className={`border p-2 ${getFactorStyle(factor.contribution)}`}
            >
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] text-gray-400 mt-0.5">
                  {factor.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-white font-mono font-bold">{factor.name}</p>
                    {factor.contribution > 0 && (
                      <span className="text-[9px] text-neon-amber font-mono">
                        +{factor.contribution}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-primary font-mono">{factor.value}</p>
                  <p className="text-[8px] text-gray-500 font-mono mt-1">{factor.description}</p>
                  {factor.details && (
                    <p className="text-[8px] text-gray-600 font-mono mt-1 italic">
                      {factor.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commit Message Examples */}
      {analysis.commit_patterns?.common_patterns && Object.keys(analysis.commit_patterns.common_patterns).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-400 font-mono uppercase mb-2">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">pattern</span>
            Detected Patterns
          </p>
          <div className="border border-white/10 p-2 bg-black/30">
            {Object.entries(analysis.commit_patterns.common_patterns).map(([pattern, count], index) => {
              // Convert regex pattern to human-readable format
              const formatPattern = (p) => {
                return p
                  .replace(/^\^/, '') // Remove leading ^
                  .replace(/\$$/, '') // Remove trailing $
                  .replace(/\\s\+/g, ' ') // \s+ = space
                  .replace(/\\w\+/g, '[word]') // \w+ = [word]
                  .replace(/\\d\+/g, '[number]') // \d+ = [number]
                  .replace(/\\\./g, '.') // \. = .
                  .replace(/\\\(/g, '(') // \( = (
                  .replace(/\\\)/g, ')') // \) = )
                  .replace(/\\/g, ''); // Remove any remaining backslashes
              };
              return (
                <div key={index} className="flex justify-between text-[9px] font-mono py-1 border-b border-white/5 last:border-0">
                  <span className="text-gray-400">"{formatPattern(pattern)}"</span>
                  <span className="text-primary">{count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Details */}
      {analysis.timeline_analysis && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-400 font-mono uppercase mb-2">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">timeline</span>
            Timeline Analysis
          </p>

          {/* Duration Banner */}
          {analysis.timeline_analysis.first_commit && analysis.timeline_analysis.last_commit && (
            <div className="border border-primary/30 bg-primary/10 p-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-gray-400 font-mono uppercase">Total Duration</span>
                <span className="text-sm text-primary font-bold font-mono">
                  {(() => {
                    const first = new Date(analysis.timeline_analysis.first_commit);
                    const last = new Date(analysis.timeline_analysis.last_commit);
                    const diffMs = Math.abs(last - first);
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                      return `${days}d ${hours}h`;
                    } else if (hours > 0) {
                      return `${hours}h ${minutes}m`;
                    } else {
                      return `${minutes}m`;
                    }
                  })()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="border border-white/10 p-2">
              <p className="text-[8px] text-gray-500 font-mono uppercase">First Commit</p>
              <p className="text-[9px] text-white font-mono">
                {analysis.timeline_analysis.first_commit ?
                  new Date(analysis.timeline_analysis.first_commit).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'N/A'}
              </p>
            </div>
            <div className="border border-white/10 p-2">
              <p className="text-[8px] text-gray-500 font-mono uppercase">Last Commit</p>
              <p className="text-[9px] text-white font-mono">
                {analysis.timeline_analysis.last_commit ?
                  new Date(analysis.timeline_analysis.last_commit).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interview Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-400 font-mono uppercase mb-2">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">quiz</span>
            Suggested Interview Questions
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-white/10 p-2 bg-white/5">
                <p className="text-[10px] text-white font-mono italic">"{rec.question}"</p>
                <p className="text-[8px] text-primary font-mono mt-1">
                  Reason: {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitAnalysis;
