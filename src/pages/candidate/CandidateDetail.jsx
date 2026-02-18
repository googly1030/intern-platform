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

// Sample candidate data
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
  const handleReject = () => {
    console.log('Candidate rejected');
  };

  const handleRequestInfo = () => {
    console.log('Request more info');
  };

  const handleApprove = () => {
    console.log('Candidate approved');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)]">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        <CandidateProfileCard candidate={sampleCandidate} />
        <ActionLinks />
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <ScoreAnalysis scores={sampleCandidate.scores} />
        <CodeAnalysisLog />
      </section>

      {/* Right Sidebar */}
      <aside className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        <SystemFlags flags={sampleCandidate.flags} />
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
