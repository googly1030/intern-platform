// Scoring Service
// API calls for submission scoring with WebSocket support

import api from './api';

// WebSocket connection manager
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Get WebSocket URL from API base URL
   */
  getWebSocketUrl() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsHost}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log('[WebSocket] Connecting to', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;

      // Re-subscribe to all active subscriptions
      this.subscribers.forEach((_callbacks, submissionId) => {
        this.subscribe(submissionId);
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received:', data.type, data);

        // Handle progress updates
        if (data.type === 'progress' && data.submission_id) {
          const callbacks = this.subscribers.get(data.submission_id);
          if (callbacks) {
            callbacks.forEach((cb) => cb(data));
          }
        }

        // Handle completion
        if (data.type === 'progress' && data.stage === 'completed') {
          const callbacks = this.subscribers.get(data.submission_id);
          if (callbacks) {
            callbacks.forEach((cb) => cb({ ...data, done: true }));
          }
        }

        // Handle errors
        if (data.type === 'progress' && data.stage === 'failed') {
          const callbacks = this.subscribers.get(data.submission_id);
          if (callbacks) {
            callbacks.forEach((cb) => cb({ ...data, error: true }));
          }
        }
      } catch (err) {
        console.error('[WebSocket] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to submission progress updates
   * @param {string} submissionId - Submission ID to subscribe to
   * @param {function} callback - Callback function for progress updates
   * @returns {function} Unsubscribe function
   */
  subscribeToProgress(submissionId, callback) {
    // Ensure connection
    this.connect();

    // Add callback to subscribers
    if (!this.subscribers.has(submissionId)) {
      this.subscribers.set(submissionId, new Set());
    }
    this.subscribers.get(submissionId).add(callback);

    // Subscribe via WebSocket
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribe(submissionId);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(submissionId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(submissionId);
          this.unsubscribe(submissionId);
        }
      }
    };
  }

  /**
   * Send subscribe message
   */
  subscribe(submissionId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        submission_id: submissionId,
      }));
    }
  }

  /**
   * Send unsubscribe message
   */
  unsubscribe(submissionId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        submission_id: submissionId,
      }));
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

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
    rules_text: data.rules_text || null,
    project_structure_text: data.project_structure_text || null,
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

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard stats with counts and recent submissions
 */
export const getDashboardStats = async () => {
  return api.get('/submissions/stats');
};

/**
 * Subscribe to real-time progress updates for a submission
 * @param {string} submissionId - Submission ID
 * @param {function} onProgress - Callback for progress updates
 * @returns {function} Unsubscribe function
 *
 * @example
 * const unsubscribe = subscribeToProgress('sub_123', (data) => {
 *   console.log(`${data.progress}% - ${data.message}`);
 *   if (data.done) {
 *     console.log('Completed!', data.data);
 *   }
 * });
 *
 * // Later: unsubscribe();
 */
export const subscribeToProgress = (submissionId, onProgress) => {
  return wsManager.subscribeToProgress(submissionId, onProgress);
};

/**
 * Poll submission status until complete (fallback if WebSocket unavailable)
 * @param {string} submissionId - Submission ID
 * @param {function} onProgress - Progress callback
 * @param {number} intervalMs - Polling interval in ms
 * @returns {Promise<Object>} Final submission result
 */
export const pollSubmissionStatus = async (submissionId, onProgress, intervalMs = 2000) => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getSubmissionStatus(submissionId);
        const submission = response.data;

        onProgress?.({
          submission_id: submissionId,
          stage: submission.status,
          progress: submission.status === 'completed' ? 100 : 50,
          message: `Status: ${submission.status}`,
        });

        if (submission.status === 'completed') {
          const report = await getScoreReport(submissionId);
          resolve(report.data);
        } else if (submission.status === 'failed') {
          reject(new Error(submission.error_message || 'Scoring failed'));
        } else {
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

// ===========================================
// Bulk Upload Functions
// ===========================================

/**
 * Download bulk submission Excel template
 * @returns {Promise<Blob>} Excel template file
 */
export const downloadBulkTemplate = async () => {
  const response = await api.get('/bulk/template', {
    responseType: 'blob'
  });
  return response;
};

/**
 * Upload bulk submissions Excel file
 * @param {File} file - Excel file with submissions
 * @returns {Promise<Object>} Upload result with batch_id
 */
export const uploadBulkSubmissions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/bulk/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response;
};

/**
 * Get bulk upload status
 * @param {string} batchId - Batch ID from upload
 * @returns {Promise<Object>} Status with counts
 */
export const getBulkStatus = async (batchId) => {
  return api.get(`/bulk/status/${batchId}`);
};

/**
 * Get Redis Queue statistics
 * @returns {Promise<Object>} Queue stats
 */
export const getQueueStats = async () => {
  return api.get('/bulk/queue/stats');
};
