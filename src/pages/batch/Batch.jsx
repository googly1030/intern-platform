import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBatch, listBatches, addMultipleSubmissions, startBatch, deleteBatch } from '../../services/batchService';
import BatchConfig from '../../components/batch/BatchConfig';
import MultipleInputs from '../../components/batch/MultipleInputs';
import CSVImport from '../../components/batch/CSVImport';
import BatchTable from '../../components/batch/BatchTable';

const Batch = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('view'); // 'create', 'edit', or 'view' - default to view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [batches, setBatches] = useState([]);
  const [currentBatchId, setCurrentBatchId] = useState(null);

  // Create batch form state
  const [batchConfig, setBatchConfig] = useState({
    name: '',
    description: '',
    rules_text: '',
    project_structure_text: '',
    scoring_weights: { codeQuality: 40, performance: 35, uiux: 25 },
  });
  const [submissionMode, setSubmissionMode] = useState('manual'); // 'manual' or 'csv'
  const [manualSubmissions, setManualSubmissions] = useState([]);

  // Load batches on component mount
  useEffect(() => {
    loadBatches();
  }, []);

  // Load batches when switching to view tab
  const loadBatches = async () => {
    try {
      const data = await listBatches({ limit: 50 });
      setBatches(data);
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    if (tab === 'view') {
      loadBatches();
    }
  };

  const handleEditBatch = (batchId) => {
    setCurrentBatchId(batchId);
    setManualSubmissions([]);
    setError(null);
    setSuccess(null);
    setActiveTab('edit');
  };

  const handleCreateBatch = async () => {
    if (!batchConfig.name.trim()) {
      setError('Please enter a batch name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createBatch(batchConfig);
      setSuccess('Batch created successfully!');

      // Reset form and switch to view tab
      setBatchConfig({
        name: '',
        description: '',
        rules_text: '',
        project_structure_text: '',
        scoring_weights: { codeQuality: 40, performance: 35, uiux: 25 },
      });

      // Reload batches and switch to view tab
      await loadBatches();
      setActiveTab('view');
    } catch (err) {
      setError(err.detail || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmissions = async () => {
    if (!currentBatchId) {
      setError('Please create a batch first');
      return;
    }

    const validSubmissions = manualSubmissions.filter(
      s => s.candidate_email.trim() && s.github_url.trim()
    );

    if (validSubmissions.length === 0) {
      setError('Please add at least one valid submission (email and GitHub URL required)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fill in missing names from emails if not provided
      const submissionsWithNames = validSubmissions.map(s => ({
        ...s,
        candidate_name: s.candidate_name.trim() || s.candidate_email.split('@')[0],
      }));

      await addMultipleSubmissions(currentBatchId, submissionsWithNames);
      setSuccess(`Added ${submissionsWithNames.length} submissions to batch!`);

      // Clear submissions
      setManualSubmissions([]);

      // Reload batches to show updated count
      loadBatches();
    } catch (err) {
      setError(err.detail || 'Failed to add submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async (csvData) => {
    if (!currentBatchId) {
      setError('Please create a batch first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fill in missing names from emails if not provided
      const submissionsWithNames = csvData.map(s => ({
        ...s,
        candidate_name: s.candidate_name?.trim() || s.candidate_email?.split('@')[0] || '',
      }));

      await addMultipleSubmissions(currentBatchId, submissionsWithNames);
      setSuccess(`Imported ${submissionsWithNames.length} submissions from CSV!`);

      // Reload batches
      loadBatches();
    } catch (err) {
      setError(err.detail || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBatch = async (batchId) => {
    setLoading(true);
    setError(null);

    try {
      await startBatch(batchId);
      setSuccess('Batch processing started!');
      loadBatches();
    } catch (err) {
      setError(err.detail || 'Failed to start batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm('Are you sure you want to delete this batch? All submissions will be deleted.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteBatch(batchId);
      setSuccess('Batch deleted successfully');
      loadBatches();
    } catch (err) {
      setError(err.detail || 'Failed to delete batch');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCurrentBatch = async () => {
    if (!currentBatchId) return;

    // First add any pending submissions
    const validSubmissions = manualSubmissions.filter(
      s => s.candidate_email.trim() && s.github_url.trim()
    );

    if (validSubmissions.length > 0) {
      await handleAddSubmissions();
    }

    // Then start the batch
    await handleStartBatch(currentBatchId);

    // Navigate to results page
    navigate(`/batch/${currentBatchId}/results`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 font-mono">
            <span className="text-primary">&gt;&gt;</span> BATCH_SUBMISSION_MANAGER
          </h1>
          <p className="text-gray-400 text-sm font-mono">
            Create and manage batches for scoring multiple submissions with the same configuration
          </p>
        </div>
        {activeTab === 'view' && (
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary text-primary font-mono text-sm hover:bg-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            CREATE_JOB
          </button>
        )}
      </div>

      {/* Tabs - only show when in create mode to navigate back */}
      {activeTab === 'create' && (
        <div className="flex items-center gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => handleTabChange('create')}
            className={`pb-3 px-2 text-sm font-mono transition-colors ${
              activeTab === 'create'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            CREATE_BATCH
          </button>
          <button
            onClick={() => handleTabChange('view')}
            className={`pb-3 px-2 text-sm font-mono transition-colors ${
              activeTab === 'view'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            VIEW_BATCHES
          </button>
        </div>
      )}

      {/* Error / Success Messages */}
      {error && (
        <div className="mb-6 border border-neon-red/50 bg-neon-red/10 px-4 py-3">
          <p className="text-neon-red text-sm font-mono">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 border border-neon-green/50 bg-neon-green/10 px-4 py-3">
          <p className="text-neon-green text-sm font-mono">{success}</p>
        </div>
      )}

      {/* Create Batch Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => handleTabChange('view')}
            className="text-gray-400 font-mono text-sm hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            BACK_TO_BATCHES
          </button>

          {/* Configure Batch */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary text-black text-xs flex items-center justify-center font-mono font-bold">1</div>
              <h2 className="text-sm text-white font-mono uppercase">Configure_Batch_Settings</h2>
            </div>
            <BatchConfig onChange={setBatchConfig} />
          </div>

          {/* Create Batch Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCreateBatch}
              disabled={loading || !batchConfig.name.trim()}
              className="px-8 py-3 bg-primary/20 border border-primary text-primary font-mono text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'CREATING...' : 'CREATE_BATCH'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Batch Tab */}
      {activeTab === 'edit' && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => handleTabChange('view')}
            className="text-gray-400 font-mono text-sm hover:text-white transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            BACK_TO_BATCHES
          </button>

          {/* Batch Info */}
          <div className="border border-white/10 p-4">
            <h2 className="text-sm text-white font-mono uppercase mb-2">
              <span className="text-primary">&gt;&gt;</span> EDITING_BATCH
            </h2>
            <p className="text-xs text-gray-500 font-mono">Add submissions manually or import from CSV</p>
          </div>

          {/* Add Submissions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary text-black text-xs flex items-center justify-center font-mono font-bold">1</div>
              <h2 className="text-sm text-white font-mono uppercase">Add_Submissions</h2>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSubmissionMode('manual')}
                className={`px-4 py-2 text-xs font-mono border transition-colors ${
                  submissionMode === 'manual'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'border-white/20 text-gray-500 hover:text-gray-300'
                }`}
              >
                MANUAL_INPUT
              </button>
              <button
                onClick={() => setSubmissionMode('csv')}
                className={`px-4 py-2 text-xs font-mono border transition-colors ${
                  submissionMode === 'csv'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'border-white/20 text-gray-500 hover:text-gray-300'
                }`}
              >
                CSV_IMPORT
              </button>
            </div>

            {submissionMode === 'manual' ? (
              <MultipleInputs onChange={setManualSubmissions} />
            ) : (
              <CSVImport onImport={handleCSVImport} />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6 border-t border-white/10">
            <button
              onClick={handleAddSubmissions}
              disabled={loading}
              className="px-8 py-3 bg-primary/20 border border-primary text-primary font-mono text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ADDING...' : 'ADD_SUBMISSIONS'}
            </button>
            <button
              onClick={handleStartCurrentBatch}
              disabled={loading}
              className="px-8 py-3 bg-neon-green/20 border border-neon-green text-neon-green font-mono text-sm hover:bg-neon-green/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'STARTING...' : 'START_BATCH_PROCESSING'}
            </button>
          </div>
        </div>
      )}

      {/* View Batches Tab */}
      {activeTab === 'view' && (
        <BatchTable
          batches={batches}
          onEdit={handleEditBatch}
          onDelete={handleDeleteBatch}
          onStart={handleStartBatch}
        />
      )}

      {/* Info Box */}
      <div className="mt-8 border border-white/10 p-4">
        <p className="text-xs text-gray-500 font-mono">
          <span className="text-primary">INFO:</span> Batches allow you to score multiple submissions with the same
          configuration. Set rules, project structure, and scoring weights once, then add multiple candidates
          via manual input or CSV import. Click the play icon to start processing when ready.
        </p>
      </div>
    </div>
  );
};

export default Batch;
