import axios from 'axios'

import { roomApi } from '../requests'



const getMyRooms = async (username) => {
    const result = await axios.get(`${roomApi}/myrooms/${username}`,  {
        headers: headers()
    })

    return result.data
}

const createRoom = async (newRoom) => {
    const result = await axios.post(`${roomApi}/`, newRoom, {
        headers: headers()
    })
    return result.data
}

const addParticipants = async (roomID, username) => {
    const result = await axios.put(`${roomApi}/`, {roomID, username} , {
        headers: headers()
    })
    return result.data
}

const getRoomById = async (roomID, username) => {
    const result = await axios.get(`${roomApi}/?id=${roomID}&username=${username}`, {
        headers: headers()
    })

    return result.data
}

const deleteRoomById = async (_id) => {    
    const result = await axios.delete(`${roomApi}/?id=${_id}`, {
        headers: headers()
    })
    return result.data
}


const leaveRoom = async (roomID, username) => {
    const result = await axios.delete(`${roomApi}/leave?roomID=${roomID}&username=${username}`, {
        headers: headers()
    })
    return result.data
}


const updateRoomState = async (room) => {
    const result = await axios.put(`${roomApi}/state`, room, {
        headers: headers()
    })
    return result.data
}

const getRoomState = async (roomID) => {
    const result = await axios.get(`${roomApi}/state?roomID=${roomID}`, {
        headers: headers()
    })
    return result.data
}
 

const headers = (token) => {
    let user = JSON.parse(localStorage.getItem('user'))
    return {
        'Authorization': `Bearer ${user.token}`
    }
}

export default {
    getMyRooms,
    updateRoomState,
    getRoomState,
    createRoom,
    addParticipants,
    leaveRoom,
    getRoomById,
    deleteRoomById
}
