import axios from 'axios'

import {userApi} from '../requests'

const insertUser = async (newuser) => {
    const result = await axios.post(userApi, newuser)
    return result.data
}

const login = async (user) => {
    const result = await axios.post(`${userApi}/login`, user)
    return result.data
}

const getUserByUsername = async (user) => {
    const result = await axios.get(`${userApi}/${user.username}`, {
        headers: headers(user.token)
    })
    return result.data
}

const getUserByUID = async (user) => {
    const result = await axios.get(`${userApi}/uid/${user.uid}`, {
        headers: headers(user.token)
    })
    return result.data
}


const headers = (token) => {
    return {
        'Authorization': `Bearer ${token}`
    }
}

export default {
    insertUser,
    login,
    getUserByUsername,
    getUserByUID
}
