import GitHubLineLink from './GitHubLineLink';

/**
 * Score Deductions Section
 * Shows detailed breakdown of why points were lost
 */
const ScoreDeductions = ({ analysisDetails, scores, githubUrl }) => {
  if (!analysisDetails) return null;

  const deductions = [];

  // File Separation Issues
  if (analysisDetails.fileSeparation?.issues?.length > 0) {
    const issues = analysisDetails.fileSeparation.issues;
    deductions.push({
      category: 'File Separation',
      score: scores?.fileSeparation || 0,
      maxScore: 10,
      issues: issues.map(issue => ({
        type: 'error',
        message: `${issue.type}: ${issue.count} instances`,
        file: issue.file,
      })),
    });
  }

  // jQuery AJAX Issues
  if (analysisDetails.jqueryAjax?.issues?.length > 0) {
    deductions.push({
      category: 'jQuery AJAX',
      score: scores?.jqueryAjax || 0,
      maxScore: 10,
      issues: analysisDetails.jqueryAjax.issues.map(issue => ({
        type: issue.includes('FORM') ? 'error' : 'warning',
        message: issue,
      })),
    });
  }

  // Bootstrap Issues
  if (analysisDetails.bootstrap?.issues?.length > 0) {
    deductions.push({
      category: 'Bootstrap',
      score: scores?.bootstrap || 0,
      maxScore: 10,
      issues: analysisDetails.bootstrap.issues.map(issue => ({
        type: 'error',
        message: issue,
      })),
    });
  }

  // Prepared Statements Issues
  if (analysisDetails.preparedStatements?.issues?.length > 0) {
    deductions.push({
      category: 'Prepared Statements',
      score: scores?.preparedStatements || 0,
      maxScore: 10,
      issues: analysisDetails.preparedStatements.issues.map(issue => ({
        type: issue.includes('SQL_INJECTION') ? 'critical' : 'warning',
        message: issue,
        details: `Raw SQL: ${analysisDetails.preparedStatements.raw_sql_queries || 0}, Prepared: ${analysisDetails.preparedStatements.prepared_statements || 0}`,
      })),
    });
  }

  // Code Complexity Issues
  if (analysisDetails.codeComplexity?.issues?.length > 0) {
    deductions.push({
      category: 'Code Complexity',
      score: analysisDetails.codeComplexity?.score || 0,
      maxScore: 10,
      issues: analysisDetails.codeComplexity.issues.map(issue => ({
        type: 'warning',
        message: issue,
      })),
    });
  }

  // Code Duplication Issues
  if (analysisDetails.codeDuplication?.issues?.length > 0) {
    deductions.push({
      category: 'Code Duplication',
      score: analysisDetails.codeDuplication?.score || 0,
      maxScore: 10,
      issues: analysisDetails.codeDuplication.issues.map(issue => ({
        type: 'warning',
        message: issue,
        details: `${analysisDetails.codeDuplication.duplication_percentage}% duplication`,
      })),
    });
  }

  // Documentation Issues
  if (analysisDetails.documentation?.issues?.length > 0) {
    deductions.push({
      category: 'Documentation',
      score: analysisDetails.documentation?.score || 0,
      maxScore: 10,
      issues: analysisDetails.documentation.issues.map(issue => ({
        type: 'warning',
        message: issue,
      })),
    });
  }

  if (deductions.length === 0) {
    return null;
  }

  return (
    <div className="border border-neon-red/30 p-6 mb-6">
      <h3 className="text-sm text-neon-red font-mono mb-4">
        &gt;&gt; SCORE DEDUCTIONS (Why marks were lost)
      </h3>

      <div className="space-y-4">
        {deductions.map((deduction, index) => (
          <div key={index} className="border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm text-white">
                {deduction.category}
              </span>
              <span className="font-mono text-sm">
                <span className="text-neon-red">{deduction.score}</span>
                <span className="text-gray-500">/{deduction.maxScore}</span>
                {deduction.score < deduction.maxScore && (
                  <span className="text-neon-red ml-2">
                    (-{deduction.maxScore - deduction.score})
                  </span>
                )}
              </span>
            </div>

            <div className="space-y-2">
              {deduction.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-mono">
                  <span className={
                    issue.type === 'critical' ? 'text-neon-red' :
                    issue.type === 'error' ? 'text-neon-red' :
                    'text-neon-amber'
                  }>
                    {issue.type === 'critical' ? '🚫' :
                     issue.type === 'error' ? '❌' : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <span className="text-gray-300">{issue.message}</span>
                    {issue.details && (
                      <span className="text-gray-500 ml-2">({issue.details})</span>
                    )}
                    {issue.file && githubUrl && (
                      <div className="text-gray-500 mt-1">
                        File: <GitHubLineLink githubUrl={githubUrl} file={issue.file} line={1} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreDeductions;
