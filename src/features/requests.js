const isProd = process.env.NODE_ENV === "production";

export const baseUrl = isProd
  ? "https://agora-be.onrender.com"
  : "http://localhost:3001";

export const userApi = `${baseUrl}/api/user`;

export const roomApi = `${baseUrl}/api/room`;
