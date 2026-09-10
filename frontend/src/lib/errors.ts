import { AxiosError } from 'axios';

/**
 * The backend returns errors in two shapes:
 *  - FastAPI's own HTTPException errors: { detail: string | object }
 *  - InsightFlow's custom exception handler: { status: "error", message, path }
 * This normalizes both into a single readable string.
 */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (data) {
      if (typeof data.message === 'string') return data.message;
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        // FastAPI 422 validation errors
        const first = data.detail[0];
        if (first?.msg) return String(first.msg);
      }
    }

    if (error.response?.status === 401) return 'Your session has expired. Please log in again.';
    if (error.response?.status === 403) return "You don't have access to this dataset.";
    if (error.response?.status === 404) return 'This dataset is no longer available. Upload it again to continue.';
    if (error.response?.status === 413) return 'That file is larger than the 100 MB limit.';
    if (error.response?.status === 415) return 'Unsupported file type. Only CSV and XLSX files are allowed.';
    if (error.response?.status === 422) return 'Some of the submitted data was invalid.';
    if (!error.response) return 'Could not reach the server. Check your connection and try again.';
  }

  return fallback;
}

export function getStatusCode(error: unknown): number | undefined {
  if (error instanceof AxiosError) return error.response?.status;
  return undefined;
}
