import { useState, useRef } from 'react';
import {
  downloadBulkTemplate,
  uploadBulkSubmissions,
} from '../../services/scoringService';

const BulkUploadSection = ({ onUploadComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const blob = await downloadBulkTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_submission_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError('Failed to download template');
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await uploadBulkSubmissions(file);
      setUploadResult(result);

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      setError(err.detail || err.message || 'Failed to upload file');
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mb-6 border border-white/10 bg-black/30">
      {/* Header - Click to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          <span className="text-white font-mono text-sm">BULK UPLOAD</span>
          {uploadResult && (
            <span className="text-neon-green text-xs font-mono ml-2 px-2 py-0.5 border border-neon-green/30 bg-neon-green/10">
              {uploadResult.queued_count} QUEUED
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-gray-400">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Instructions */}
          <div className="text-xs text-gray-500 font-mono space-y-1 bg-black/30 p-3 border border-white/5">
            <p className="text-gray-400 font-bold mb-2">INSTRUCTIONS:</p>
            <p>1. Download the Excel template using the button below</p>
            <p>2. Fill in candidate details (name, email, GitHub URL are required)</p>
            <p>3. Upload the completed file to queue all submissions</p>
            <p className="text-neon-amber mt-2">Note: Processing happens in the background via Redis Queue</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {/* Download Template Button */}
            <button
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDownloading ? 'sync' : 'download'}
              </span>
              {isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD TEMPLATE'}
            </button>

            {/* Upload Button */}
            <label className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary text-primary cursor-pointer hover:bg-primary/30 transition-colors text-sm">
              <span className="material-symbols-outlined text-[18px]">
                {isUploading ? 'sync' : 'upload'}
              </span>
              {isUploading ? 'UPLOADING...' : 'UPLOAD EXCEL'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border border-neon-red/50 bg-neon-red/10 px-4 py-2 flex items-start gap-2">
              <span className="material-symbols-outlined text-neon-red text-[18px]">error</span>
              <p className="text-neon-red text-sm font-mono">{error}</p>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="border border-neon-green/50 bg-neon-green/10 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-neon-green">check_circle</span>
                <span className="text-neon-green text-sm font-mono font-bold">UPLOAD SUCCESSFUL</span>
              </div>
              <div className="text-xs text-gray-400 font-mono space-y-1 ml-7">
                <p>Batch ID: <span className="text-white">{uploadResult.batch_id}</span></p>
                <p>Total submissions: <span className="text-white">{uploadResult.total_submissions}</span></p>
                <p>Queued for processing: <span className="text-neon-green">{uploadResult.queued_count}</span></p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-neon-amber">Errors ({uploadResult.errors.length}):</p>
                    {uploadResult.errors.slice(0, 3).map((err, idx) => (
                      <p key={idx} className="text-neon-red ml-2">Row {err.row}: {err.error}</p>
                    ))}
                    {uploadResult.errors.length > 3 && (
                      <p className="text-gray-500 ml-2">...and {uploadResult.errors.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supported formats */}
          <div className="text-[10px] text-gray-600 font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Supported formats: .xlsx, .xls
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadSection;
