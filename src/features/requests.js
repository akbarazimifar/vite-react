const isProd = process.env.NODE_ENV === 'production'

export const userApi = isProd ? 'https://mysql-express-user.vercel.app/' : 'http://localhost:3001/api/user'

