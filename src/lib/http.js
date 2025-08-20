// src/lib/http.js
const API = import.meta.env.VITE_API_URL;
async function request(path, options={}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...(options.headers||{})},
    ...options,
  });
  let data=null; try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status; err.payload = data; throw err;
  }
  return data;
}
export const http = {
  get: (p) => request(p, { method:'GET' }),
  post: (p,b) => request(p, { method:'POST', body: JSON.stringify(b) }),
};