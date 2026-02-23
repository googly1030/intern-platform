// Batch Service
// API calls for batch submission management

import api from './api';

/**
 * Create a new batch
 * @param {Object} data - Batch data
 * @param {string} data.name - Batch name
 * @param {string} [data.description] - Optional description
 * @param {string} [data.rules_text] - Optional custom rules
 * @param {string} [data.project_structure_text] - Optional project structure
 * @param {Object} [data.scoring_weights] - Optional scoring weights
 * @returns {Promise<Object>} Created batch
 */
export const createBatch = async (data) => {
  return api.post('/batches', data);
};

/**
 * List all batches
 * @param {Object} params - Query parameters
 * @param {number} [params.skip] - Number to skip
 * @param {number} [params.limit] - Max results
 * @param {string} [params.status] - Filter by status
 * @returns {Promise<Array>} List of batches
 */
export const listBatches = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status_filter', params.status);

  return api.get(`/batches?${queryParams.toString()}`);
};

/**
 * Get batch details
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} Batch details
 */
export const getBatch = async (batchId) => {
  return api.get(`/batches/${batchId}`);
};

/**
 * Update batch details
 * @param {string} batchId - Batch ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated batch
 */
export const updateBatch = async (batchId, data) => {
  return api.put(`/batches/${batchId}`, data);
};

/**
 * Add a single submission to a batch
 * @param {string} batchId - Batch ID
 * @param {Object} data - Submission data
 * @param {string} data.candidate_name - Candidate name
 * @param {string} data.candidate_email - Candidate email
 * @param {string} data.github_url - GitHub URL
 * @param {string} [data.hosted_url] - Optional hosted URL
 * @param {string} [data.video_url] - Optional video URL
 * @returns {Promise<Object>} Created submission
 */
export const addSubmission = async (batchId, data) => {
  return api.post(`/batches/${batchId}/submit`, data);
};

/**
 * Add multiple submissions to a batch
 * @param {string} batchId - Batch ID
 * @param {Array<Object>} submissions - Array of submission data
 * @returns {Promise<Object>} Result with submission IDs
 */
export const addMultipleSubmissions = async (batchId, submissions) => {
  return api.post(`/batches/${batchId}/submit/multiple`, submissions);
};

/**
 * Import submissions from CSV file
 * @param {string} batchId - Batch ID
 * @param {File} file - CSV file
 * @returns {Promise<Object>} Import result with submission IDs
 */
export const importCSV = async (batchId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/batches/${batchId}/csv`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: [(data) => data], // Skip default JSON transform
  });
  return response;
};

/**
 * Start processing a batch
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} Updated batch
 */
export const startBatch = async (batchId) => {
  return api.post(`/batches/${batchId}/start`);
};

/**
 * Get batch results with all submissions
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} Batch results with submissions and stats
 */
export const getBatchResults = async (batchId) => {
  return api.get(`/batches/${batchId}/results`);
};

/**
 * Export batch results as CSV
 * @param {string} batchId - Batch ID
 * @returns {Promise<Blob>} CSV file blob
 */
export const exportBatchResults = async (batchId) => {
  const response = await api.get(`/batches/${batchId}/export`, {
    responseType: 'blob',
  });
  return response;
};

/**
 * Delete a batch
 * @param {string} batchId - Batch ID
 * @returns {Promise<void>}
 */
export const deleteBatch = async (batchId) => {
  return api.delete(`/batches/${batchId}`);
};
