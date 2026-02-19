/**
 * Interview Questions Section
 * Generates suggested interview questions based on code analysis weaknesses
 */
const InterviewQuestions = ({ report }) => {
  if (!report) return null;

  const questions = [];

  // Generate questions based on weaknesses
  const weaknesses = report.weaknesses || [];
  const flags = report.flags || [];
  const analysisDetails = report.analysisDetails || {};

  // SQL Injection related
  if (flags.includes('SQL_INJECTION_RISK') || weaknesses.some(w => w.toLowerCase().includes('sql'))) {
    questions.push({
      category: 'Security',
      question: 'I noticed some raw SQL queries in your code. Can you explain what SQL injection is and how you would prevent it?',
      difficulty: 'medium',
    });
  }

  // Code organization
  if (flags.includes('CODE_MIXING') || flags.includes('POOR_FOLDER_STRUCTURE')) {
    questions.push({
      category: 'Architecture',
      question: 'Your code has HTML, CSS, and JavaScript mixed in some files. Why is separation of concerns important in web development?',
      difficulty: 'easy',
    });
  }

  // Code duplication
  if (analysisDetails.codeDuplication?.duplication_percentage > 20) {
    questions.push({
      category: 'Code Quality',
      question: `Your code has ${Math.round(analysisDetails.codeDuplication.duplication_percentage)}% duplication. How would you refactor to reduce code repetition?`,
      difficulty: 'medium',
    });
  }

  // Deep nesting
  if (analysisDetails.codeComplexity?.max_nesting_depth > 4) {
    questions.push({
      category: 'Code Quality',
      question: 'Some of your functions have deep nesting levels. What strategies can you use to reduce nesting depth?',
      difficulty: 'medium',
    });
  }

  // Documentation
  if (!analysisDetails.documentation?.readme?.exists || analysisDetails.documentation?.readme?.quality < 3) {
    questions.push({
      category: 'Documentation',
      question: 'Documentation is important for maintainability. What would you include in a good README file?',
      difficulty: 'easy',
    });
  }

  // AJAX vs Form Submission
  if (flags.includes('FORM_SUBMISSION_USED')) {
    questions.push({
      category: 'Frontend',
      question: 'Why might jQuery AJAX be preferred over traditional form submissions for user experience?',
      difficulty: 'easy',
    });
  }

  // Bootstrap
  if (flags.includes('NO_BOOTSTRAP')) {
    questions.push({
      category: 'Frontend',
      question: 'What are the benefits of using a CSS framework like Bootstrap?',
      difficulty: 'easy',
    });
  }

  // Database choices
  const hasMultipleDbs = [
    analysisDetails.databases?.mysql?.detected,
    analysisDetails.databases?.mongodb?.detected,
    analysisDetails.databases?.redis?.detected,
  ].filter(Boolean).length > 1;

  if (hasMultipleDbs) {
    questions.push({
      category: 'Database',
      question: 'You implemented multiple databases (MySQL, MongoDB, Redis). When would you choose one over the other?',
      difficulty: 'medium',
    });
  }

  // AI Generation
  if (report.aiGenerationRisk > 0.5) {
    questions.push({
      category: 'Development Process',
      question: 'How do you ensure you understand code fully before using it in production?',
      difficulty: 'easy',
    });
  }

  // Error handling
  if (flags.includes('NO_ERROR_HANDLING') || weaknesses.some(w => w.toLowerCase().includes('error'))) {
    questions.push({
      category: 'Code Quality',
      question: 'What are some best practices for error handling in PHP applications?',
      difficulty: 'medium',
    });
  }

  // Deployment
  if (flags.includes('NO_DEPLOYMENT') || flags.includes('DEPLOYMENT_NOT_ACCESSIBLE')) {
    questions.push({
      category: 'DevOps',
      question: 'Walk me through how you would deploy a PHP application to a production server.',
      difficulty: 'medium',
    });
  }

  // Add generic questions if we don't have enough
  if (questions.length < 3) {
    questions.push({
      category: 'General',
      question: 'What was the most challenging part of this project and how did you solve it?',
      difficulty: 'easy',
    });
  }

  // Limit to 5 questions
  const displayQuestions = questions.slice(0, 5);

  if (displayQuestions.length === 0) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-neon-green';
      case 'medium': return 'text-neon-amber';
      case 'hard': return 'text-neon-red';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Security': 'lock',
      'Architecture': 'architecture',
      'Code Quality': 'analytics',
      'Documentation': 'description',
      'Frontend': 'palette',
      'Database': 'storage',
      'Development Process': 'settings',
      'DevOps': 'rocket_launch',
      'General': 'chat',
    };
    return icons[category] || 'help';
  };

  return (
    <div className="border border-white/10 p-6 mb-6">
      <h3 className="text-sm text-neon-magenta font-mono mb-4">
        &gt;&gt; SUGGESTED INTERVIEW QUESTIONS
      </h3>
      <p className="text-xs text-gray-500 font-mono mb-4">
        Based on the code analysis, here are questions to ask the candidate:
      </p>

      <div className="space-y-3">
        {displayQuestions.map((q, index) => (
          <div key={index} className="border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-gray-400">{getCategoryIcon(q.category)}</span>
              <span className="text-xs text-gray-400 font-mono">{q.category}</span>
              <span className={`text-xs font-mono ${getDifficultyColor(q.difficulty)}`}>
                [{q.difficulty}]
              </span>
            </div>
            <p className="text-sm text-gray-300 font-mono">
              <span className="text-primary">{index + 1}.</span> {q.question}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewQuestions;
