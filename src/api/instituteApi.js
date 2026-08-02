const BASE_URL = 'http://localhost:5000';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

export const fetchInstituteMeta = async () => {
  const res = await fetch(`${BASE_URL}/api/institute/meta`);
  return parseJson(res);
};

export const fetchInstituteStudents = async ({
  instituteEmail,
  q = '',
  exam = 'All',
  state = 'All',
  seed = true
} = {}) => {
  const params = new URLSearchParams();
  params.set('instituteEmail', instituteEmail || '');
  if (q) params.set('q', q);
  if (exam) params.set('exam', exam);
  if (state) params.set('state', state);
  if (!seed) params.set('seed', '0');
  const res = await fetch(`${BASE_URL}/api/institute/students?${params}`);
  return parseJson(res);
};

export const createInstituteStudent = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/institute/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
};

export const updateInstituteStudent = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/api/institute/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
};

export const deleteInstituteStudent = async (id) => {
  const res = await fetch(`${BASE_URL}/api/institute/students/${id}`, { method: 'DELETE' });
  return parseJson(res);
};

export const seedInstituteStudents = async ({ instituteEmail, force = false, instituteName } = {}) => {
  const res = await fetch(`${BASE_URL}/api/institute/students/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instituteEmail, force, instituteName })
  });
  return parseJson(res);
};
