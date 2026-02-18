// Scoring Service
// API calls for submission scoring

import api from './api';

/**
 * Submit a GitHub URL for scoring
 * @param {Object} data - Submission data
 * @param {string} data.candidate_name - Candidate name
 * @param {string} data.candidate_email - Candidate email
 * @param {string} data.github_url - GitHub repository URL
 * @param {string} [data.hosted_url] - Optional hosted URL
 * @param {string} [data.video_url] - Optional video demo URL
 * @returns {Promise<Object>} Submission response with ID
 */
export const submitForScoring = async (data) => {
  return api.post('/submissions', {
    candidate_name: data.candidate_name,
    candidate_email: data.candidate_email,
    github_url: data.github_url,
    hosted_url: data.hosted_url || null,
    video_url: data.video_url || null,
  });
};

/**
 * Get submission status
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Submission details
 */
export const getSubmissionStatus = async (submissionId) => {
  return api.get(`/submissions/${submissionId}`);
};

/**
 * Get full score report
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Complete score report
 */
export const getScoreReport = async (submissionId) => {
  return api.get(`/submissions/${submissionId}/report`);
};

/**
 * List all submissions
 * @param {Object} params - Query parameters
 * @param {number} [params.skip=0] - Number to skip
 * @param {number} [params.limit=20] - Max results
 * @param {string} [params.status] - Filter by status
 * @returns {Promise<Array>} List of submissions
 */
export const listSubmissions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status_filter', params.status);

  return api.get(`/submissions?${queryParams.toString()}`);
};

/**
 * Trigger scoring for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object>} Updated submission
 */
export const triggerScoring = async (submissionId) => {
  return api.post(`/submissions/${submissionId}/trigger`);
};
