import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const BatchTable = ({ batches, onEdit, onDelete, onStart }) => {
  const navigate = useNavigate();

  // Note: navigate is still used for the "View Results" button

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-neon-green';
      case 'processing':
        return 'text-primary animate-pulse';
      case 'failed':
        return 'text-neon-red';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-neon-green/10 border-neon-green/30';
      case 'processing':
        return 'bg-primary/10 border-primary/30';
      case 'failed':
        return 'bg-neon-red/10 border-neon-red/30';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="border border-white/10 overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-mono uppercase tracking-wider">
              Batch Name
            </th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-mono uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-mono uppercase tracking-wider">
              Progress
            </th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-mono uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs text-gray-400 font-mono uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {batches.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center">
                <p className="text-gray-500 font-mono text-sm">NO_BATCHES_FOUND</p>
                <p className="text-gray-600 font-mono text-xs mt-1">Create a new batch to get started</p>
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-mono">{batch.name}</p>
                    {batch.description && (
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
                        {batch.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-mono border rounded ${getStatusBg(batch.status)} ${getStatusColor(batch.status)}`}>
                    {batch.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-800 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${batch.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {batch.completed_submissions}/{batch.total_submissions}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-400 font-mono">
                    {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Results */}
                    {batch.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/batch/${batch.id}/results`)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="View Results"
                      >
                        <span className="material-symbols-outlined text-sm">analytics</span>
                      </button>
                    )}

                    {/* Start Batch */}
                    {batch.status === 'pending' && batch.total_submissions > 0 && (
                      <button
                        onClick={() => onStart?.(batch.id)}
                        className="p-1.5 text-gray-400 hover:text-neon-green transition-colors"
                        title="Start Processing"
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </button>
                    )}

                    {/* Edit Batch */}
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => onEdit?.(batch.id)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="Edit Batch"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}

                    {/* Delete Batch */}
                    {batch.status !== 'processing' && (
                      <button
                        onClick={() => onDelete?.(batch.id)}
                        className="p-1.5 text-gray-400 hover:text-neon-red transition-colors"
                        title="Delete Batch"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTable;
