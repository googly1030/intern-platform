import CandidateRow from './CandidateRow';

const DataTable = ({ candidates = [] }) => {
  return (
    <div className="border border-white/10 overflow-hidden relative">
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-white/10 text-[10px] uppercase text-primary font-mono tracking-widest">
              <th className="px-6 py-4 font-normal">Candidate_ID</th>
              <th className="px-6 py-4 font-normal">Email</th>
              <th className="px-6 py-4 font-normal text-center">Grade</th>
              <th className="px-6 py-4 font-normal">Repository</th>
              <th className="px-6 py-4 font-normal">Status_Flag</th>
              <th className="px-6 py-4 font-normal">Timestamp</th>
              <th className="px-6 py-4 font-normal text-right">Run_Cmd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {candidates.map((candidate) => (
              <CandidateRow key={candidate.id} candidate={candidate} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
