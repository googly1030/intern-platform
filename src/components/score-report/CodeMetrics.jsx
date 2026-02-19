/**
 * Code Metrics Section
 * Displays quantified analysis of the codebase
 */
const CodeMetrics = ({ analysisDetails, scores }) => {
  if (!analysisDetails) return null;

  const metrics = [
    {
      label: 'Files Analyzed',
      value: analysisDetails.folderStructure?.existing_files?.length || 0,
      icon: 'folder',
    },
    {
      label: 'Total Lines',
      value: analysisDetails.documentation?.comments?.total_lines || 'N/A',
      icon: 'description',
    },
    {
      label: 'Comment Ratio',
      value: analysisDetails.documentation?.comments?.ratio
        ? `${analysisDetails.documentation.comments.ratio}%`
        : 'N/A',
      icon: 'chat_bubble_outline',
      warning: analysisDetails.documentation?.comments?.ratio < 2,
    },
    {
      label: 'Avg Function Length',
      value: analysisDetails.codeComplexity?.avg_function_length
        ? `${Math.round(analysisDetails.codeComplexity.avg_function_length)} lines`
        : 'N/A',
      icon: 'straighten',
      warning: analysisDetails.codeComplexity?.avg_function_length > 30,
    },
    {
      label: 'Max Nesting Depth',
      value: analysisDetails.codeComplexity?.max_nesting_depth || 'N/A',
      icon: 'account_tree',
      warning: analysisDetails.codeComplexity?.max_nesting_depth > 4,
    },
    {
      label: 'Code Duplication',
      value: analysisDetails.codeDuplication?.duplication_percentage
        ? `${analysisDetails.codeDuplication.duplication_percentage}%`
        : 'N/A',
      icon: 'content_copy',
      warning: analysisDetails.codeDuplication?.duplication_percentage > 20,
    },
    {
      label: 'README Quality',
      value: analysisDetails.documentation?.readme?.quality
        ? `${analysisDetails.documentation.readme.quality}/5`
        : '0/5',
      icon: 'menu_book',
      warning: !analysisDetails.documentation?.readme?.exists,
    },
    {
      label: 'AJAX Calls',
      value: analysisDetails.jqueryAjax?.ajax_calls || 0,
      icon: 'sync',
    },
  ];

  return (
    <div className="border border-white/10 p-6 mb-6">
      <h3 className="text-sm text-primary font-mono mb-4">
        &gt;&gt; CODE METRICS
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-3 border ${
              metric.warning
                ? 'border-neon-amber/50 bg-neon-amber/5'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[16px] text-gray-400">{metric.icon}</span>
              <span className="text-xs text-gray-400 font-mono">{metric.label}</span>
            </div>
            <div
              className={`text-lg font-mono ${
                metric.warning ? 'text-neon-amber' : 'text-white'
              }`}
            >
              {metric.value}
            </div>
            {metric.warning && (
              <span className="material-symbols-outlined text-[14px] text-neon-amber">warning</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeMetrics;
