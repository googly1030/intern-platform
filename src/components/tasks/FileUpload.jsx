const FileUpload = ({ onFileDrop, onFileSelect }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    onFileDrop?.(files);
  };

  return (
    <div
      className="dotted-glow h-full min-h-[250px] flex flex-col items-center justify-center p-8 bg-black/50 group hover:bg-primary/5 transition-colors cursor-pointer relative overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[pulse_4s_linear_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />

      <input
        id="file-input"
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => onFileSelect?.(e.target.files)}
      />

      <span className="material-symbols-outlined text-6xl text-primary/50 mb-4 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
        upload_file
      </span>

      <h3 className="text-white font-mono text-lg mb-2">DRAG_AND_DROP_PDF</h3>

      <p className="text-gray-500 text-xs font-mono text-center max-w-[200px]">
        Accepts .pdf spec files. System will auto-extract requirements.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <span className="px-2 py-1 border border-primary/30 text-[10px] text-primary font-mono bg-black hover:bg-primary hover:text-black transition-colors">
          BROWSE_FILES
        </span>
      </div>
    </div>
  );
};

export default FileUpload;
