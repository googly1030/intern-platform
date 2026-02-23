import { useState } from 'react';

const MultipleInputs = ({ onChange }) => {
  const [rows, setRows] = useState([
    { id: 1, candidate_name: '', candidate_email: '', github_url: '', hosted_url: '', video_url: '' },
    { id: 2, candidate_name: '', candidate_email: '', github_url: '', hosted_url: '', video_url: '' },
    { id: 3, candidate_name: '', candidate_email: '', github_url: '', hosted_url: '', video_url: '' },
  ]);

  const handleChange = (id, field, value) => {
    const newRows = rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setRows(newRows);
    onChange?.(newRows);
  };

  const handleAddRow = () => {
    const newId = Math.max(...rows.map(r => r.id)) + 1;
    const newRow = { id: newId, candidate_name: '', candidate_email: '', github_url: '', hosted_url: '', video_url: '' };
    const newRows = [...rows, newRow];
    setRows(newRows);
    onChange?.(newRows);
  };

  const handleRemoveRow = (id) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter(row => row.id !== id);
    setRows(newRows);
    onChange?.(newRows);
  };

  const getValidSubmissions = () => {
    return rows.filter(row =>
      row.candidate_email.trim() && row.github_url.trim()
    );
  };

  return (
    <div className="border border-white/10 p-6 relative">
      <div className="absolute -top-3 left-4 bg-background px-2">
        <span className="text-xs text-primary font-mono">SUBMISSIONS</span>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.id} className="relative border border-white/5 p-4 bg-black/30">
            {/* Row number label */}
            <div className="absolute -left-2 top-4 bg-primary text-black text-[10px] font-mono px-2 py-1 rounded">
              #{index + 1}
            </div>

            {/* Remove button */}
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-neon-red transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Candidate Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">NAME</label>
                <input
                  type="text"
                  value={row.candidate_name}
                  onChange={(e) => handleChange(row.id, 'candidate_name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">
                  EMAIL <span className="text-neon-red">*</span>
                </label>
                <input
                  type="email"
                  value={row.candidate_email}
                  onChange={(e) => handleChange(row.id, 'candidate_email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* GitHub URL */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">
                  GITHUB URL <span className="text-neon-red">*</span>
                </label>
                <input
                  type="url"
                  value={row.github_url}
                  onChange={(e) => handleChange(row.id, 'github_url', e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Hosted URL */}
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-mono">HOSTED URL</label>
                <input
                  type="url"
                  value={row.hosted_url}
                  onChange={(e) => handleChange(row.id, 'hosted_url', e.target.value)}
                  placeholder="https://project.vercel.app"
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Video URL */}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1 font-mono">VIDEO URL</label>
                <input
                  type="url"
                  value={row.video_url}
                  onChange={(e) => handleChange(row.id, 'video_url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Row Button */}
        <button
          type="button"
          onClick={handleAddRow}
          className="w-full border border-dashed border-white/20 py-3 text-gray-500 font-mono text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          ADD_SUBMISSION_ROW
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 font-mono">
          <span className="text-primary">INFO:</span> {getValidSubmissions().length} valid submissions ready.
          Fields marked with <span className="text-neon-red">*</span> are required.
        </p>
      </div>
    </div>
  );
};

export default MultipleInputs;
