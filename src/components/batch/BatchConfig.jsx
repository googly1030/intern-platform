import { useState } from 'react';
import PDFToggleUpload from './PDFToggleUpload';
import { ScoringWeights } from '../tasks';

const BatchConfig = ({ onChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [projectStructureText, setProjectStructureText] = useState('');
  const [scoringWeights, setScoringWeights] = useState({
    codeQuality: 40,
    performance: 35,
    uiux: 25,
  });

  const handleConfigChange = () => {
    onChange?.({
      name,
      description,
      rules_text: rulesText,
      project_structure_text: projectStructureText,
      scoring_weights: scoringWeights,
    });
  };

  return (
    <div className="space-y-6">
      {/* Batch Name */}
      <div className="border border-white/10 p-4">
        <label className="block text-xs text-primary/70 font-mono mb-2">BATCH_NAME</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleConfigChange();
          }}
          placeholder="e.g., Frontend Intern Batch - Feb 2025"
          className="w-full bg-black/50 border border-gray-700 text-white font-mono text-sm px-3 py-2 focus:border-primary focus:ring-0 placeholder-gray-600"
        />

        {/* Optional Description */}
        <label className="block text-xs text-primary/70 font-mono mb-2 mt-3">DESCRIPTION (optional)</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleConfigChange();
          }}
          placeholder="Optional description of this batch..."
          rows={2}
          className="w-full bg-black/50 border border-gray-700 text-white font-mono text-sm px-3 py-2 focus:border-primary focus:ring-0 placeholder-gray-600 resize-none"
        />
      </div>

      {/* Scoring Weights */}
      <div className="border border-white/10 p-4">
        <ScoringWeights onWeightsChange={(weights) => {
          setScoringWeights(weights);
          handleConfigChange();
        }} />
      </div>

      {/* Rules Upload */}
      <PDFToggleUpload
        label="CUSTOM_RULES"
        value={rulesText}
        onChange={(value) => {
          setRulesText(value);
          handleConfigChange();
        }}
        placeholder="Enter custom evaluation rules here...&#10;&#10;For example:&#10;- Use TypeScript for type safety&#10;- Follow React hooks best practices&#10;- Implement proper error handling&#10;- Write unit tests for all functions"
      />

      {/* Project Structure Upload */}
      <PDFToggleUpload
        label="PROJECT_STRUCTURE"
        value={projectStructureText}
        onChange={(value) => {
          setProjectStructureText(value);
          handleConfigChange();
        }}
        placeholder="Describe the expected project structure...&#10;&#10;For example:&#10;- /src - Source code&#10;- /components - React components&#10;- /api - API endpoints&#10;- /utils - Utility functions&#10;- /tests - Test files"
      />
    </div>
  );
};

export default BatchConfig;
