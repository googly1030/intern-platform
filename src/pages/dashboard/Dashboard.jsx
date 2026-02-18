import { useState } from 'react';
import {
  StatCard,
  MiniChart,
  CircleProgress,
  ProgressBar,
  ProgressDots,
  SearchFilter,
  DataTable,
  Pagination
} from '../../components/dashboard';

// Sample data
const sampleCandidates = [
  {
    id: 'DEV-8291',
    name: 'Alex Chen',
    role: 'SR_FULL_STACK',
    score: 98,
    techStack: ['REACT', 'NODE', 'AWS'],
    status: 'interviewing',
    date: '2023-10-24',
    time: '14:30Z',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0bowEfljw-DonqmYIavPVwPKxzNGeYkjZjHPBx3vIAawhBRd_zJ6-DLvnqfLHj9a--u6sPVepUaO6iFOViJHC63O_ezq7Upn0r5m-1W8ROzYv-w7GAHB-_rN6M1Et72TOUYXlt5OQhcHT087qxThcJJwtrNRktF_vZldfrwqdWZpJQilbx_pxlT8fOR1r3yLc6eiZCTMkah3tkGY0offION_rU-WobWHckOBP6iOIZIYbuOD46mvy8u1GS-DXIooUbGrgwqExQ5s',
    online: true
  },
  {
    id: 'DEV-8244',
    name: 'Sarah Miller',
    role: 'DEVOPS_ENG',
    score: 92,
    techStack: ['K8S', 'DOCKER'],
    status: 'offer-sent',
    date: '2023-10-23',
    time: '09:15Z',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFLu4Fp4YJo3fOYqiKP22u2zXxqYCt0rCCA0bpqLncbab6X787Gqe31fPigKt69TJvsYwXx1vCJE4jkW9MS8DwbDXr2VFFxer9NqtOwx0dXLkTSBQe7sYtLC8MD41UYKy_VBjFG3DqoQPAG3OjakXEjJ7xlqJNFuDTRTcz7yPklK4qgih0wlZvpDjybfwMxFEYU4DNLji1wf-ANMJGdub3zwdtiwt28JodA8Egi_spoq7e4NpME-d3C40NEu6XQvT6qccUC6Gm6B8',
    online: false
  },
  {
    id: 'DEV-8102',
    name: 'David Kim',
    role: 'FRONTEND_DEV',
    score: 76,
    techStack: ['VUE', 'TAILWIND'],
    status: 'pending',
    date: '2023-10-22',
    time: '11:45Z',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFLN9DWhJLR_6SiCd2YzzP3-Kw8vSjipUnY_qzSwvd-Xf7FVSJloZKaupOoyj7tvk7jB2YORsFv2H5MXEK4i2Mk_8h_B_uwukzdL-f1rT9bG_OOPM1BOftNsxZRPpD0OPJAUIGqJd_WIdtRGQqLRs3iGnPCt6mpxjOGyYXCfERH-3Bifm7aCDoL5TB9x4B95xz-t41AoI45JDqVKdQeGcHftnPN9PwZGz1dWyyFhDe0FWsJHxK6MtZT2ifECrhDsiaQnlaiiG4zzQ',
    online: false
  },
  {
    id: 'DEV-8005',
    name: 'Marcus R.',
    role: 'BACKEND_INT',
    score: 45,
    techStack: ['PYTHON', 'DJANGO'],
    status: 'withdrawn',
    date: '2023-10-21',
    time: '16:20Z',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnwvA6eHwAgTuoWJLIqLhqgAe8FNZuIPPF2y-HQ2RWLyOxH2thGJinC-nC2wyEcEGUyPDAKVIHCFB2VQ7tS9GD8eOU1qCKtgDGABDCXF0Trs7MDijgEC2XQw61w7FBc7hmbRQCbnD1spySc6tngjBuvzAfe74_bvKaEM9upYkVlSXkFU3JWLxAP-dQIXyiggSBewyByotcndbSghHFJVKd8SzamdCyhhrxTMVUndQHLJ8h_pmI_48Kj4GlOlTgaB2UWmR5S4OdZGQ',
    online: false
  }
];

const Dashboard = () => {
  const [candidates] = useState(sampleCandidates);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (term) => {
    console.log('Search:', term);
  };

  const handleFilterChange = (filters) => {
    console.log('Filters:', filters);
  };

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 mb-10 relative border border-white/5">
        {/* Vertical dividers */}
        <div className="hidden lg:block absolute top-4 bottom-4 left-1/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="hidden lg:block absolute top-4 bottom-4 left-2/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="hidden lg:block absolute top-4 bottom-4 left-3/4 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        <StatCard title="CANDIDATES" value="1,248" trend trendValue={12}>
          <MiniChart />
        </StatCard>

        <StatCard title="AVG_SCORE" value="84" subtitle="/100">
          <div className="flex justify-between items-start h-full mt-4">
            <p className="text-[10px] text-neon-green font-mono">&gt;&gt; OPTIMIZED</p>
            <CircleProgress value={84} />
          </div>
        </StatCard>

        <StatCard title="PENDING" value="42" type="amber">
          <ProgressBar value={65} color="neon-amber" />
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Queue processing...</p>
        </StatCard>

        <StatCard title="HIRED" value="156" icon="check_circle" type="green">
          <ProgressDots filled={4} total={5} />
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Target: 200</p>
        </StatCard>
      </div>

      {/* Divider */}
      <div className="divider-glow w-full mb-8" />

      {/* Search & Filters */}
      <SearchFilter onSearch={handleSearch} onFilterChange={handleFilterChange} />

      {/* Data Table */}
      <DataTable candidates={candidates} />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={42}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default Dashboard;
