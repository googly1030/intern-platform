import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBatchResults } from '../../services/batchService';
import { subscribeToProgress } from '../../services/scoringService';
import BatchResultsDisplay from '../../components/batch/BatchResults';

const BatchResults = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const loadResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getBatchResults(batchId);
      setData(result);
    } catch (err) {
      setError(err.detail || 'Failed to load batch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();

    // Set up polling for processing batches
    const interval = setInterval(() => {
      if (data?.batch?.status === 'processing') {
        loadResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [batchId]);

  // Subscribe to WebSocket updates for all submissions
  useEffect(() => {
    if (!data) return;

    const unsubscribers = [];

    data.submissions.forEach((submission) => {
      if (submission.status === 'pending' || submission.status === 'processing') {
        const unsubscribe = subscribeToProgress(submission.id, (progressData) => {
          // Reload results when submission completes
          if (progressData.done || progressData.error) {
            loadResults();
          }
        });
        unsubscribers.push(unsubscribe);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">LOADING_BATCH_RESULTS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="border border-neon-red/50 bg-neon-red/10 px-4 py-6 text-center">
          <p className="text-neon-red font-mono mb-4">{error}</p>
          <button
            onClick={() => navigate('/batch')}
            className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-sm hover:border-white/40 transition-colors"
          >
            BACK_TO_BATCHES
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/batch')}
        className="mb-6 text-gray-400 font-mono text-sm hover:text-white transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        BACK_TO_BATCHES
      </button>

      <BatchResultsDisplay
        batch={data.batch}
        submissions={data.submissions}
        stats={data.stats}
      />
    </div>
  );
};

export default BatchResults;
