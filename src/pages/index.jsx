import React, { useCallback, useEffect, useMemo } from 'react'
import Login from '../components/login'
import { FaRegWindowClose } from 'react-icons/fa'
import { useSelector, useDispatch } from 'react-redux'
import { login, setProps } from '../features/user/userSlice'
import { useNavigate } from 'react-router-dom'
const Home = () => {

    const userState = useSelector(state => state.user)
    const {
        loginLoading,
        user
    } = userState

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const submitLogin = useCallback(
        (user) => {
            dispatch(login(user))
            //navigate('/lobby')
        },
        [],
    )
    
    useEffect(() => {
        if (user) {
            navigate('/lobby')
        }
    }, [user])
    

    return (
        <div>
            <Login submitLogin={submitLogin} isLoading={loginLoading}/>
        </div>
    )
}

export default React.memo(Home)