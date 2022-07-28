import React, { useCallback, useMemo } from 'react'
import Login from '../components/login'
import { FaRegWindowClose } from 'react-icons/fa'
import { useSelector, useDispatch } from 'react-redux'
import { login, setProps } from '../features/user/userSlice'
import { useNavigate } from 'react-router-dom'
const Home = () => {

    const userState = useSelector(state => state.user)
    const {
        loginMessage,
        loginLoading,
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

    const message = useMemo(() => {
        if (loginMessage) {
            return (
                <div className='
                    p-4 rounded border-4 border-red-500 text-red-500 bg-red-200 w-1/2 mx-auto
                    flex justify-between items-center
                '>
                    {loginMessage}
                    <FaRegWindowClose onClick={() => dispatch(setProps({ ...userState, loginMessage: '', loginLoading: false }))} />
                </div>
            )
        }
    }, [loginMessage])


    return (
        <div>
            <Login submitLogin={submitLogin} />

            {message}
        </div>
    )
}

export default React.memo(Home)