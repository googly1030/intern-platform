import { useState } from 'react';

const PDFToggleUpload = ({ label, value, onChange, placeholder = '' }) => {
  const [mode, setMode] = useState('text'); // 'text' or 'pdf'
  const [fileName, setFileName] = useState(null);

  const handleTextChange = (e) => {
    onChange?.(e.target.value);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === 'application/pdf') {
      try {
        const text = await extractTextFromPDF(file);
        onChange?.(text);
      } catch (err) {
        console.error('Failed to read PDF:', err);
      }
    } else {
      // For text files, read as text
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange?.(e.target.result);
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

  const handleClear = () => {
    onChange?.('');
    setFileName(null);
  };

  return (
    <div className="border border-white/10 p-4 bg-black/30">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm text-gray-400 font-mono">
          {label} <span className="text-gray-600">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          {/* Toggle between PDF and Text mode */}
          <div className="flex items-center bg-black/50 border border-white/10 rounded">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-3 py-1 text-xs font-mono rounded-l transition-colors ${
                mode === 'text'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              TEXT
            </button>
            <button
              type="button"
              onClick={() => setMode('pdf')}
              className={`px-3 py-1 text-xs font-mono rounded-r transition-colors ${
                mode === 'pdf'
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {mode === 'text' ? (
        <textarea
          value={value || ''}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-black/50 border border-white/20 px-3 py-2 text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
        />
      ) : (
        <div className="border border-dashed border-white/20 rounded p-4 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id={`pdf-upload-${label.replace(/\s/g, '-')}`}
          />
          <label
            htmlFor={`pdf-upload-${label.replace(/\s/g, '-')}`}
            className="cursor-pointer flex flex-col items-center"
          >
            <span className="material-symbols-outlined text-3xl text-primary/50 mb-2">
              upload_file
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {fileName ? fileName : 'Click to upload PDF or TXT file'}
            </span>
          </label>
        </div>
      )}

      {value && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs bg-neon-red/10 border border-neon-red/30 px-3 py-1 text-neon-red font-mono hover:bg-neon-red/20 transition-colors"
          >
            CLEAR
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFToggleUpload;
