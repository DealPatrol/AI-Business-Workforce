export type ApiError = Error & {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
};

export async function prospectorRequest<T>(url: string, body?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    code?: string;
    retryAfterSeconds?: number;
  };
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.') as ApiError;
    error.status = response.status;
    error.code = data.code;
    error.retryAfterSeconds = data.retryAfterSeconds;
    throw error;
  }
  return data;
}
