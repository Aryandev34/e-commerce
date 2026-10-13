const API_ROOT = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.detail || payload?.error || 'We could not complete that request.';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return payload;
}

export async function getProducts() {
  return apiRequest('/products/');
}
