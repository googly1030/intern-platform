import { generateGitHubLineUrl } from '../../utils/githubLink';

/**
 * Clickable link that opens a specific file:line in GitHub
 */
const GitHubLineLink = ({ githubUrl, file, line, branch = 'main' }) => {
  const url = generateGitHubLineUrl(githubUrl, file, line, branch);

  if (!url) {
    return <span className="text-gray-400">{file}:{line}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline font-mono text-xs"
      title={`Open ${file}:${line} in GitHub`}
    >
      {file}:{line}
    </a>
  );
};

export default GitHubLineLink;
