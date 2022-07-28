import React from 'react'
import Register from '../components/register'
import { useSelector, useDispatch } from 'react-redux'
import { insertUser } from '../features/user/userSlice'
function register() {

    const userState = useSelector(state => state.user)
    const {
        isLoading,
    } = userState

    const dispatch = useDispatch()

    return (
        <div>
            {isLoading}
            <Register onSubmit={newuser => dispatch(insertUser(newuser))}/>
        </div>
    )
}

export default register