import axios from 'axios'

import {userApi} from '../requests'

const insertUser = async (newuser) => {
    return await axios.post(userApi, newuser)
}

const login = async (user) => {
    return await axios.post(`${userApi}/login`, user)
}

export default {
    insertUser,
    login
}
