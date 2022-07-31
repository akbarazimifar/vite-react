const isProd = process.env.NODE_ENV === 'production'

const baseUrl = isProd ? 'https://videoconferencing-mysql.herokuapp.com' : 'http://localhost:3001'

export const userApi = `${baseUrl}/api/user` 

