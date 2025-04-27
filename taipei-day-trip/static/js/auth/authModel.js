export async function fetchLoginStatus(token) {
  const response = await fetch('/api/user/auth', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error("登入狀態 API 回傳錯誤");
  return await response.json();
}

export async function registerUser({ name, email, password }) {
  const response = await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

export async function loginUser({ email, password }) {
  const response = await fetch('/api/user/auth', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  return { ok: response.ok, data };
}