import React, { useCallback, useState, useEffect } from 'react'

import Protected from '../../middleware/protected'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/user/userSlice'
import { useNavigate } from 'react-router-dom'
function index() {

    const userState = useSelector(state => state.user)
    const {
        loginMessage,
        loginLoading,
        user
    } = userState

    useEffect(() => {
        localStorage.setItem('roomMembers', JSON.stringify([]))
    }, [])

    const navigate = useNavigate()
    

    if(user) {
        return (
            <div className='container mx-auto px-4 font-mono'>

                <div>
                    <h1 className='text-lg'>Join Room</h1>
                    <form className='flex items-center'>
                        <input type="text" name="" id="" className='bg-purple-100 p-1 text-purple-500'/>
                        <button className='text-sm px-3 py-1 bg-purple-500 text-white rounded mx-2'>JOIN</button>
                    </form>
                </div>


                <div id="rooms" className="">
                    <h1 className='text-lg'>ROOMS</h1>
                    <div className='flex justify-between px-3 py-1 rounded bg-purple-500 text-white items-center mb-3'>
                        <div>
                            Room Title
                            <br />
                            <small className='text-sm text-purple-100'>5 participants</small>
                        </div>

                        <div className='flex items-center'>
                            <button onClick={() => navigate('/lobby/room?id=123')} className='text-sm bg-purple-100 p-1 rounded text-purple-500 mx-3'>
                                JOIN
                            </button>

                            <button className='p-2 rounded-full bg-red-700 shaodw-red-500 shadow'></button>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        useEffect(() => {
            navigate('/')
        }, [user])
    }
}

export default React.memo(index)