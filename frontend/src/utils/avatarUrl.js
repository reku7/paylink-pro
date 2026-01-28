// utils/avatarUrl.js
export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${import.meta.env.VITE_SERVER_URL}${avatar}`;
};
