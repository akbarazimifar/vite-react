import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { insertUser } from '../user/userSlice'

const baseUrl = process.env.NODE_ENV === 'production' ? 
    'http://localhost:30001' : 'http://localhost:3001'

export const userSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl }),
    endpoints: (builder) => {
        insertUser: builder.query({
            query: () => '/login',
        })
    }
})

export const {
    useInsertUser
} = userSlice