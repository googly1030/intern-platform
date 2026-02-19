import { useState } from 'react';

/**
 * UI Snapshots Section for Score Report
 * Shows screenshots if the project is hosted, otherwise shows "Not Hosted"
 */
const UISnapshotsSection = ({ screenshots, hostedUrl }) => {
  const [previewImage, setPreviewImage] = useState(null);

  // Check if there's a screenshot error (e.g., Playwright not installed)
  const hasError = screenshots?.error && typeof screenshots.error === 'string';

  // Filter out error keys and null values
  const validScreenshots = screenshots
    ? Object.entries(screenshots).filter(([key, value]) => value && key !== 'error')
    : [];

  // Check if project is hosted
  const isHosted = hostedUrl && !hasError && validScreenshots.length > 0;

  // Show error state if Playwright failed
  if (hasError && hostedUrl) {
    const isPlaywrightError = screenshots.error.includes('Playwright') || screenshots.error.includes('browser');
    return (
      <div className="border border-white/10 p-6 mb-6">
        <h3 className="text-sm text-neon-amber font-mono mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
          &gt;&gt; UI_SNAPSHOTS
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-4xl text-neon-amber mb-3">
            {isPlaywrightError ? 'browser_not_supported' : 'error'}
          </span>
          <p className="text-gray-400 font-mono text-sm">
            {isPlaywrightError ? 'SCREENSHOT SERVICE UNAVAILABLE' : 'SCREENSHOTS FAILED'}
          </p>
          <p className="text-gray-600 font-mono text-xs mt-1">
            {isPlaywrightError
              ? 'Browser automation not configured on server'
              : 'Unable to capture page screenshots'}
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            Deployed at: <a href={hostedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{hostedUrl}</a>
          </p>
        </div>
      </div>
    );
  }

  if (!isHosted) {
    return (
      <div className="border border-white/10 p-6 mb-6">
        <h3 className="text-sm text-gray-400 font-mono mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
          &gt;&gt; UI_SNAPSHOTS
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-4xl text-gray-600 mb-3">cloud_off</span>
          <p className="text-gray-500 font-mono text-sm">NOT HOSTED</p>
          <p className="text-gray-600 font-mono text-xs mt-1">
            No deployment URL provided or screenshots unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 p-6 mb-6">
      <h3 className="text-sm text-neon-green font-mono mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
        &gt;&gt; UI_SNAPSHOTS
      </h3>
      <p className="text-xs text-gray-500 font-mono mb-4">
        Captured from: <a href={hostedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{hostedUrl}</a>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {validScreenshots.map(([pageName, screenshotPath], index) => (
          <div
            key={index}
            className="border border-white/10 p-1 relative group cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setPreviewImage({ name: pageName, path: screenshotPath })}
          >
            {/* Corner decorations */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-primary" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-primary" />

            <div className="bg-black aspect-video overflow-hidden">
              <img
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                src={`/api/submissions/screenshots/${screenshotPath.split('/').pop()}`}
                alt={pageName}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23111" width="400" height="300"/><text fill="%23555" x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace">Preview unavailable</text></svg>';
                }}
              />
            </div>
            <div className="text-[10px] text-center mt-1 text-primary/70 font-mono uppercase">
              {pageName.replace(/_/g, ' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] m-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            {/* Image title */}
            <p className="text-center text-white font-mono text-sm mb-3 uppercase">
              {previewImage.name.replace(/_/g, ' ')}
            </p>

            {/* Image */}
            <img
              className="max-w-full max-h-[80vh] object-contain border border-white/20"
              src={`/api/submissions/screenshots/${previewImage.path.split('/').pop()}`}
              alt={previewImage.name}
            />

            {/* Hint */}
            <p className="text-center text-white/50 font-mono text-xs mt-3">
              Click outside to close
            </p>
          </div>
        </div>
      )}

      {validScreenshots.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 font-mono text-sm">No screenshots captured</p>
        </div>
      )}
    </div>
  );
};

export default UISnapshotsSection;
