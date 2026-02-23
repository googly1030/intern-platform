import { useState, useRef } from 'react';
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
    rules_text: '',
    project_structure_text: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const rulesFileInputRef = useRef(null);
  const structureFileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle PDF file upload for rules
  const handleRulesFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(file);
        setFormData((prev) => ({ ...prev, rules_text: text }));
      } catch (err) {
        setError('Failed to read PDF. Please try copying the text manually.');
      }
    } else {
      // For text files, read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, rules_text: e.target.result }));
      };
      reader.readAsText(file);
    }
  };

  // Handle PDF file upload for project structure
  const handleStructureFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(file);
        setFormData((prev) => ({ ...prev, project_structure_text: text }));
      } catch (err) {
        setError('Failed to read PDF. Please try copying the text manually.');
      }
    } else {
      // For text files, read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, project_structure_text: e.target.result }));
      };
      reader.readAsText(file);
    }
  };

  // Extract text from PDF using pdf.js
  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      text += pageText + '\n';
    }

    return text;
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

        {/* Advanced Options Section */}
        <div className="border border-white/10 p-6 relative">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-primary font-mono hover:text-primary/80 transition-colors flex items-center gap-2"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              <span>ADVANCED OPTIONS</span>
              <span className="text-gray-600">(optional)</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {/* Rules Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 font-mono">
                    CUSTOM RULES <span className="text-gray-600">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={rulesFileInputRef}
                      onChange={handleRulesFileUpload}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => rulesFileInputRef.current?.click()}
                      className="text-xs bg-white/5 border border-white/10 px-3 py-1 text-gray-400 font-mono hover:border-white/20 transition-colors"
                    >
                      📁 UPLOAD PDF/TXT
                    </button>
                    {(formData.rules_text) && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, rules_text: '' }))}
                        className="text-xs bg-neon-red/10 border border-neon-red/30 px-3 py-1 text-neon-red font-mono hover:bg-neon-red/20 transition-colors"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  name="rules_text"
                  value={formData.rules_text}
                  onChange={handleChange}
                  placeholder="Enter custom evaluation rules here...&#10;&#10;For example:&#10;- Use TypeScript for type safety&#10;- Follow React hooks best practices&#10;- Implement proper error handling&#10;- Write unit tests for all functions"
                  rows={4}
                  className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
                />
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  Upload a PDF or paste custom rules for evaluation. If not provided, general coding standards will be used.
                </p>
              </div>

              {/* Project Structure Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400 font-mono">
                    PROJECT STRUCTURE <span className="text-gray-600">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={structureFileInputRef}
                      onChange={handleStructureFileUpload}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => structureFileInputRef.current?.click()}
                      className="text-xs bg-white/5 border border-white/10 px-3 py-1 text-gray-400 font-mono hover:border-white/20 transition-colors"
                    >
                      📁 UPLOAD PDF/TXT
                    </button>
                    {(formData.project_structure_text) && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, project_structure_text: '' }))}
                        className="text-xs bg-neon-red/10 border border-neon-red/30 px-3 py-1 text-neon-red font-mono hover:bg-neon-red/20 transition-colors"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  name="project_structure_text"
                  value={formData.project_structure_text}
                  onChange={handleChange}
                  placeholder="Describe the expected project structure...&#10;&#10;For example:&#10;- /src - Source code&#10;- /components - React components&#10;- /api - API endpoints&#10;- /utils - Utility functions&#10;- /tests - Test files"
                  rows={4}
                  className="w-full bg-black/50 border border-white/20 px-4 py-3 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
                />
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  Upload a PDF or paste the expected project structure. If not provided, a general efficient structure will be assumed.
                </p>
              </div>
            </div>
          )}
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
              rules_text: '',
              project_structure_text: '',
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
