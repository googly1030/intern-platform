import { useState } from 'react';

const CSVImport = ({ onImport }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSV(text);
        setPreview(parsed);
      } catch (err) {
        setError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredColumns = ['name', 'email', 'github_url'];

    // Check for required columns (case-insensitive)
    const headerMap = {};
    const missingColumns = [];

    requiredColumns.forEach(col => {
      const foundIndex = headers.findIndex(h =>
        h === col || h === col.replace('_url', '') || h === col.replace('_', '')
      );
      if (foundIndex >= 0) {
        headerMap[col] = foundIndex;
      } else {
        missingColumns.push(col);
      }
    });

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length && i <= 10; i++) { // Limit to 10 rows preview
      const columns = lines[i].split(',').map(c => c.trim());
      if (columns.length < 3) continue;

      data.push({
        candidate_name: columns[headerMap.name] || '',
        candidate_email: columns[headerMap.email] || '',
        github_url: columns[headerMap.github_url] || '',
        hosted_url: columns[headers.findIndex(h => h.includes('hosted'))] || null,
        video_url: columns[headers.findIndex(h => h.includes('video'))] || null,
      });
    }

    return {
      headers: headers.filter(h => h),
      totalRows: lines.length - 1,
      previewRows: data,
      allData: lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          candidate_name: cols[headerMap.name] || '',
          candidate_email: cols[headerMap.email] || '',
          github_url: cols[headerMap.github_url] || '',
          hosted_url: cols[headers.findIndex(h => h.includes('hosted'))] || null,
          video_url: cols[headers.findIndex(h => h.includes('video'))] || null,
        };
      }).filter(row => row.candidate_email && row.github_url)
    };
  };

  const handleImport = () => {
    if (preview && preview.allData) {
      onImport?.(preview.allData);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="border border-white/10 p-6 relative">
      <div className="absolute -top-3 left-4 bg-background px-2">
        <span className="text-xs text-neon-green font-mono">CSV_IMPORT</span>
      </div>

      {!preview ? (
        <div>
          <div className="border border-dashed border-white/20 rounded p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-import-input"
            />
            <label
              htmlFor="csv-import-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="material-symbols-outlined text-4xl text-primary/50 mb-3">
                upload_file
              </span>
              <span className="text-sm text-gray-400 font-mono mb-2">
                DRAG_AND_DROP_CSV_OR_BROWSE
              </span>
              <span className="text-xs text-gray-600 font-mono">
                Accepts .csv files with columns: name, email, github_url, hosted_url (optional), video_url (optional)
              </span>
            </label>
          </div>

          {error && (
            <div className="mt-4 border border-neon-red/50 bg-neon-red/10 px-4 py-2">
              <p className="text-neon-red text-xs font-mono">{error}</p>
            </div>
          )}

          {/* Sample CSV format */}
          <div className="mt-4 p-3 bg-black/50 border border-white/5 rounded">
            <p className="text-xs text-gray-500 font-mono mb-2">SAMPLE_CSV_FORMAT:</p>
            <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`name,email,github_url,hosted_url,video_url
John Doe,john@example.com,https://github.com/john/repo,https://john.vercel.app,https://drive.google.com/...
Jane Smith,jane@example.com,https://github.com/jane/project,,
Bob Wilson,bob@example.com,https://github.com/bob/app,,`}
            </pre>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm text-white font-mono">CSV_PREVIEW</h3>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Found {preview.totalRows} rows • Showing first {preview.previewRows.length}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-gray-500 hover:text-white font-mono transition-colors"
            >
              CLEAR
            </button>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto border border-white/10 rounded">
            <table className="w-full text-xs font-mono">
              <thead className="bg-white/5">
                <tr>
                  {preview.headers.map((header, i) => (
                    <th key={i} className="px-3 py-2 text-left text-gray-400 border-b border-white/10">
                      {header.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    {preview.headers.map((header, j) => (
                      <td key={j} className="px-3 py-2 text-gray-300 truncate max-w-[150px]">
                        {row[Object.keys(row)[j]] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              className="flex-1 bg-primary/20 border border-primary text-primary px-4 py-2 font-mono text-sm hover:bg-primary/30 transition-colors"
            >
              IMPORT_{preview.allData.length}_SUBMISSIONS
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-white/20 text-gray-400 font-mono text-sm hover:border-white/40 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
