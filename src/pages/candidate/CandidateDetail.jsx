import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CandidateProfileCard,
  ActionLinks,
  ScoreAnalysis,
  CodeAnalysisLog,
  SystemFlags,
  UISnapshots,
  CommitHistory,
  DecisionFooter,
} from '../../components/candidate';
import { getSubmissionStatus, getScoreReport } from '../../services/scoringService';

// Sample candidate data for fallback
const sampleCandidate = {
  id: '8291',
  name: 'Neo Anderson',
  role: 'Full Stack Architect',
  email: 'neo@matrix.com',
  education: "MIT, Class of '24",
  location: 'New York, NY (Remote)',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0bowEfljw-DonqmYIavPVwPKxzNGeYkjZjHPBx3vIAawhBRd_zJ6-DLvnqfLHj9a--u6sPVepUaO6iFOViJHC63O_ezq7Upn0r5m-1W8ROzYv-w7GAHB-_rN6M1Et72TOUYXlt5OQhcHT087qxThcJJwtrNRktF_vZldfrwqdWZpJQilbx_pxlT8fOR1r3yLc6eiZCTMkah3tkGY0offION_rU-WobWHckOBP6iOIZIYbuOD46mvy8u1GS-DXIooUbGrgwqExQ5s',
  scores: [
    { label: 'Frontend_Arch', value: 98, color: 'neon-green' },
    { label: 'Backend_Sys', value: 85, color: 'primary' },
    { label: 'Security_Ops', value: 72, color: 'neon-amber' },
    { label: 'Algorithmic_Eff', value: 91, color: 'secondary' },
  ],
  flags: [
    { type: 'error', icon: 'security', title: 'Security Risk', description: 'Old dependency in 2021 project (CVE-2021-44228)' },
    { type: 'warning', icon: 'speed', title: 'Performance', description: 'Frontend bundle size > 2MB on initial load' },
  ],
};

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (id) {
      fetchSubmissionData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchSubmissionData = async () => {
    try {
      setLoading(true);
      // First get basic submission status
      const submissionData = await getSubmissionStatus(id);
      setSubmission(submissionData);

      // If completed, fetch full report
      if (submissionData.status === 'completed') {
        try {
          const reportData = await getScoreReport(id);
          setReport(reportData);
        } catch (reportErr) {
          console.error('Failed to fetch report:', reportErr);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch submission:', err);
      setError('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    console.log('Candidate rejected');
  };

  const handleRequestInfo = () => {
    console.log('Request more info');
  };

  const handleApprove = () => {
    console.log('Candidate approved');
  };

  // Build candidate data from API response
  const buildCandidateData = () => {
    if (!submission) return sampleCandidate;

    return {
      id: submission.id,
      name: submission.candidate_name,
      email: submission.candidate_email,
      github_url: submission.github_url,
      hosted_url: submission.hosted_url,
      role: 'Intern Candidate',
      scores: report?.scores ? [
        { label: 'Folder_Structure', value: report.scores.folderStructure || 0, color: 'neon-green' },
        { label: 'File_Separation', value: report.scores.fileSeparation || 0, color: 'primary' },
        { label: 'jQuery_AJAX', value: report.scores.jqueryAjax || 0, color: 'primary' },
        { label: 'Bootstrap', value: report.scores.bootstrap || 0, color: 'neon-amber' },
        { label: 'Prepared_Stmts', value: report.scores.preparedStatements || 0, color: 'neon-green' },
        { label: 'Database_Usage', value: report.scores.databases || 0, color: 'primary' },
        { label: 'LocalStorage', value: report.scores.localStorage || 0, color: 'secondary' },
        { label: 'Security', value: report.scores.security || 0, color: 'neon-amber' },
        { label: 'Code_Quality', value: report.scores.codeQuality || 0, color: 'neon-green' },
        { label: 'Deployment', value: report.scores.deployment || 0, color: 'primary' },
      ] : sampleCandidate.scores,
      flags: report?.flags?.map(flag => ({
        type: flag.includes('AI_GENERATED') ? 'error' : 'warning',
        icon: flag.includes('AI') ? 'smart_toy' : 'warning',
        title: flag.replace(/_/g, ' '),
        description: '',
      })) || sampleCandidate.flags,
      grade: submission.grade,
      overall_score: submission.overall_score,
      status: submission.status,
      strengths: report?.strengths || [],
      weaknesses: report?.weaknesses || [],
      aiGenerationRisk: report?.aiGenerationRisk || 0,
    };
  };

  const candidate = buildCandidateData();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-180px)]">
        <div className="flex items-center gap-3 text-gray-400">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          <span className="text-sm">Loading candidate details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-180px)]">
        <div className="text-center">
          <span className="material-symbols-outlined text-neon-red text-4xl">error</span>
          <p className="text-gray-400 mt-2">{error}</p>
          <button
            onClick={() => navigate('/candidates')}
            className="mt-4 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  // Processing/Pending state
  if (submission && submission.status !== 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] gap-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-5xl animate-pulse">hourglass_empty</span>
          <h2 className="text-xl font-bold text-white mt-4">Submission {submission.status}</h2>
          <p className="text-gray-400 mt-2">
            {submission.status === 'processing'
              ? 'Analyzing code repository...'
              : 'Waiting to be processed...'}
          </p>
          <p className="text-gray-600 text-sm mt-1">Candidate: {submission.candidate_name}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchSubmissionData}
            className="px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm"
          >
            Refresh Status
          </button>
          <button
            onClick={() => navigate('/candidates')}
            className="px-4 py-2 border border-gray-600 text-gray-400 hover:bg-white/5 transition-colors text-sm"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)]">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        <CandidateProfileCard candidate={candidate} />
        <ActionLinks />
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <ScoreAnalysis scores={candidate.scores} overallScore={candidate.overall_score} grade={candidate.grade} />
        {report && (
          <div className="bg-black/50 border border-white/10 p-4 space-y-4">
            {report.strengths && report.strengths.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-neon-green mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                  STRENGTHS
                </h3>
                <ul className="space-y-1">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                      <span className="text-neon-green">+</span> {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.weaknesses && report.weaknesses.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-neon-amber mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  AREAS FOR IMPROVEMENT
                </h3>
                <ul className="space-y-1">
                  {report.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                      <span className="text-neon-amber">-</span> {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <CodeAnalysisLog />
      </section>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        <SystemFlags flags={candidate.flags} />
        {candidate.aiGenerationRisk > 0 && (
          <div className="bg-black/50 border border-white/10 p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">AI GENERATION RISK</h3>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold ${
                candidate.aiGenerationRisk > 0.7 ? 'text-neon-red' :
                candidate.aiGenerationRisk > 0.4 ? 'text-neon-amber' : 'text-neon-green'
              }`}>
                {Math.round(candidate.aiGenerationRisk * 100)}%
              </div>
              <div className="flex-1 h-2 bg-gray-800 overflow-hidden">
                <div
                  className={`h-full ${
                    candidate.aiGenerationRisk > 0.7 ? 'bg-neon-red' :
                    candidate.aiGenerationRisk > 0.4 ? 'bg-neon-amber' : 'bg-neon-green'
                  }`}
                  style={{ width: `${candidate.aiGenerationRisk * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        <UISnapshots />
        <CommitHistory totalCommits={1240} />
      </aside>

      {/* Decision Footer */}
      <DecisionFooter
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
        onApprove={handleApprove}
      />
    </div>
  );
};

export default CandidateDetail;
