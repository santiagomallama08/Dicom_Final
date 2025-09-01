// src/utils/authHeaders.js
export const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    return user?.user_id;
  } catch {
    return undefined;
  }
};

export const userHeaders = () => {
  const uid = getUserId();
  return uid ? { 'X-User-Id': uid } : {};
};
