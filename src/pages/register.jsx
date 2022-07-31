import React, { useEffect, useState } from 'react'
import Register from '../components/register'
import { useSelector, useDispatch } from 'react-redux'
import { insertUser, setProps } from '../features/user/userSlice'

function register() {

    const userState = useSelector(state => state.user)
    const {
        isRegistered,
    } = userState


    useEffect(() => {
        // If registering succeed
        if (isRegistered) {
            setTimeout(() => {
                window.location.href = '/'
            }, 2000)
        }
    }, [isRegistered])

    const dispatch = useDispatch()

    return (
        <div>
            <Register onSubmit={newuser => dispatch(insertUser(newuser))}/>
        </div>
    )
}

export default register