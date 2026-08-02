/**
 * Real document vault API — Mongo-backed uploads
 */
const BASE_URL = 'http://localhost:5000';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

export const fileUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
};

export const fetchVault = async (email) => {
  const res = await fetch(`${BASE_URL}/api/vault?email=${encodeURIComponent(email)}`);
  return parseJson(res);
};

export const updateVaultProfile = async (email, profile) => {
  const res = await fetch(`${BASE_URL}/api/vault/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...profile })
  });
  return parseJson(res);
};

export const uploadVaultDocument = async ({
  email,
  file,
  name,
  type,
  issueDate,
  dimensions
}) => {
  const form = new FormData();
  form.append('document', file);
  form.append('email', email);
  if (name) form.append('name', name);
  if (type) form.append('type', type);
  if (issueDate) form.append('issueDate', issueDate);
  if (dimensions) form.append('dimensions', dimensions);

  const res = await fetch(`${BASE_URL}/api/vault/upload`, {
    method: 'POST',
    body: form
  });
  return parseJson(res);
};

export const deleteVaultDocument = async (id, email) => {
  const qs = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`${BASE_URL}/api/vault/documents/${id}${qs}`, {
    method: 'DELETE'
  });
  return parseJson(res);
};

export const updateVaultDocument = async (id, email, patch) => {
  const res = await fetch(`${BASE_URL}/api/vault/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...patch })
  });
  return parseJson(res);
};

/** Read image dimensions in the browser before upload */
export function readImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith('image/')) {
      resolve('N/A (Document)');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(`${img.naturalWidth}x${img.naturalHeight} px`);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve('As uploaded');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
