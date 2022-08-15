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
            <div className='flex font-mono justify-center bg-gradient-to-l from-purple-800 via-violet-900 to-purple-900 text-white py-3 fixed top-0 left-0 w-full'>
                <div className='container flex justify-between items-center'>
                    <div className='font-bold '>
                        RARACHAT
                    </div>

                    <div>
                        <button className='bg-gray-800 text-xs rounded text-white p-1'>
                            GIT
                        </button>
                    </div>
                </div>
            </div>

        
            <div className='h-1/3  flex justify-center text-white py-10 bg-gradient-to-bl from-purple-800 via-violet-500 to-violet-800'>
                <div className='container'>
                
                    <p className=' text-white font-bold mt-20 text-4xl '>
                        Welcome to RARACHAT
                    </p>
                    <Login submitLogin={submitLogin} isLoading={loginLoading}/>
                </div>
            </div>

            <div className='flex justify-center my-10  h-auto' >
                <div className='container '>
                    <p className='text-purple-600 font-bold'>Video Calls / Live Chat </p>
                    <div className=' flex justify-between gap-10 h-80  relative' >
                        <div className='rounded-lg bg-white  shadow-sm p-5 w-full bg-no-repeat bg-center bg-cover' style={{backgroundImage:`url('/sample1.JPG')`}}>
                            
                        </div>

                        <div className='rounded-lg bg-purple-600 p-5  w-full bg-no-repeat bg-position-center bg-cover' style={{backgroundImage:`url('/sample2.JPG')`}}>
                            
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default React.memo(Home)