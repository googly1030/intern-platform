import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitForScoring } from '../../services/scoringService';

const Submit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    github_url: '',
    hosted_url: '',
    video_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await submitForScoring(formData);
      // Navigate to results page with the submission ID
      navigate(`/scoring/${result.id}`);
    } catch (err) {
      setError(err.detail || 'Failed to submit. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 font-mono">
          <span className="text-primary">&gt;&gt;</span> SUBMIT PROJECT
        </h1>
        <p className="text-gray-400 text-sm font-mono">
          Enter candidate details and GitHub repository URL for automated scoring
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Candidate Info Section */}
        <div className="border border-white/10 p-6 relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs text-primary font-mono">CANDIDATE_INFO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                NAME <span className="text-neon-red">*</span>
              </label>
              <input
                type="text"
                name="candidate_name"
                value={formData.candidate_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                EMAIL <span className="text-neon-red">*</span>
              </label>
              <input
                type="email"
                name="candidate_email"
                value={formData.candidate_email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Repository Section */}
        <div className="border border-white/10 p-6 relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <span className="text-xs text-neon-green font-mono">REPOSITORY</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                GITHUB URL <span className="text-neon-red">*</span>
              </label>
              <input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                required
                placeholder="https://github.com/username/repository"
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                HOSTED URL <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="url"
                name="hosted_url"
                value={formData.hosted_url}
                onChange={handleChange}
                placeholder="https://your-project.vercel.app"
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-mono">
                VIDEO DEMO URL <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border border-neon-red/50 bg-neon-red/10 px-4 py-3">
            <p className="text-neon-red text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary/20 border border-primary text-primary px-6 py-3 font-mono text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                PROCESSING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>&gt;&gt;</span> START SCORING
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFormData({
              candidate_name: '',
              candidate_email: '',
              github_url: '',
              hosted_url: '',
              video_url: '',
            })}
            className="px-6 py-3 border border-white/20 text-gray-400 font-mono text-sm hover:border-white/40 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 border border-white/10 p-4">
        <p className="text-xs text-gray-500 font-mono">
          <span className="text-primary">INFO:</span> The scoring process may take 1-2 minutes.
          The system will analyze the repository structure, code quality, database implementation,
          and security practices.
        </p>
      </div>
    </div>
  );
};

export default Submit;
