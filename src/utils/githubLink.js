/**
 * GitHub Link Utilities
 * Generate URLs to specific files and lines in GitHub repositories
 */

/**
 * Parse a GitHub URL to extract owner and repo name
 * @param {string} githubUrl - GitHub repository URL
 * @returns {{owner: string, repo: string} | null}
 */
export function parseGitHubUrl(githubUrl) {
  if (!githubUrl) return null;

  // Handle various GitHub URL formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const patterns = [
    /github\.com[\/:]([^\/]+)\/([^\/\.]+)/,
    /github\.com[\/:]([^\/]+)\/(.+?)\.git$/,
  ];

  for (const pattern of patterns) {
    const match = githubUrl.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  return null;
}

/**
 * Generate a GitHub URL to a specific file
 * @param {string} githubUrl - Repository URL
 * @param {string} filePath - Path to the file in the repo
 * @param {string} branch - Branch name (default: 'main')
 * @returns {string | null}
 */
export function generateGitHubFileUrl(githubUrl, filePath, branch = 'main') {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return null;

  // Clean up file path
  const cleanPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/');

  return `https://github.com/${parsed.owner}/${parsed.repo}/blob/${branch}/${cleanPath}`;
}

/**
 * Generate a GitHub URL to a specific line in a file
 * @param {string} githubUrl - Repository URL
 * @param {string} filePath - Path to the file in the repo
 * @param {number} lineNumber - Line number
 * @param {string} branch - Branch name (default: 'main')
 * @returns {string | null}
 */
export function generateGitHubLineUrl(githubUrl, filePath, lineNumber, branch = 'main') {
  const fileUrl = generateGitHubFileUrl(githubUrl, filePath, branch);
  if (!fileUrl) return null;

  return `${fileUrl}#L${lineNumber}`;
}

/**
 * Generate a GitHub URL to a range of lines
 * @param {string} githubUrl - Repository URL
 * @param {string} filePath - Path to the file in the repo
 * @param {number} startLine - Start line number
 * @param {number} endLine - End line number
 * @param {string} branch - Branch name (default: 'main')
 * @returns {string | null}
 */
export function generateGitHubLineRangeUrl(githubUrl, filePath, startLine, endLine, branch = 'main') {
  const fileUrl = generateGitHubFileUrl(githubUrl, filePath, branch);
  if (!fileUrl) return null;

  return `${fileUrl}#L${startLine}-L${endLine}`;
}

/**
 * Get the repository name from URL
 * @param {string} githubUrl - Repository URL
 * @returns {string}
 */
export function getRepoName(githubUrl) {
  const parsed = parseGitHubUrl(githubUrl);
  return parsed ? parsed.repo : 'Repository';
}
