
import React, { useEffect, useMemo, useCallback, useState } from 'react'

import './App.css'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate,

} from 'react-router-dom'
import Home from './pages/index.jsx'
import Register from './pages/register'
import Lobby from './pages/lobby'
import Room from './pages/lobby/room'

// Store
import { useSelector, useDispatch } from 'react-redux'
import { setProps as userSetProps, logout } from './features/user/userSlice'
import { setProps as roomSetProps, } from './features/room/roomSlice'
//Layout
import UserHeader from './components/layout/userHeader'
import room from './pages/lobby/room'

import loadScript from './hooks/loadScript'
import { baseUrl } from './features/requests'


function App() {
  // // Load RTM
  // loadScript(`${baseUrl}/AgoraRTM`)

  // // Load RTC
  // loadScript(`${baseUrl}/AgoraRTC`)




  const roomState = useSelector(state => state.room)
  const userState = useSelector(state => state.user)

  const {
      globalSuccessMessage,
      globalErrorMessage,
      isLoadingPage,
      invitingMe,
      user,
  } = userState


  const dispatch = useDispatch()
  
  let errorMessage = useMemo(() => {
    if(userState.globalErrorMessage || roomState.globalErrorMessage ) {
      setTimeout(() => {
        dispatch(userSetProps({...userState, globalErrorMessage:''}))
        dispatch(roomSetProps({...roomState, globalErrorMessage:''}))
      }, 4000)
      return (
        <div className="border-4 border-red-500 bg-red-200 white rounded text-red-500 p-5 w-1/2 mx-auto">
          {userState.globalErrorMessage || roomState.globalErrorMessage }
        </div>
      )
    }
  }, [userState.globalErrorMessage, roomState.globalErrorMessage])

  let successMessage = useMemo(() => {
    if(userState.globalSuccessMessage || roomState.globalSuccessMessage ) {
      setTimeout(() => {
        dispatch(userSetProps({...userState, globalSuccessMessage:''}))
        dispatch(roomSetProps({...roomState, globalSuccessMessage:''}))
      }, 4000)
      return (
        <div className="border-4 border-green-500 bg-green-200 rounded text-green-500 p-5 w-1/2 mx-auto">
          { userState.globalSuccessMessage || roomState.globalSuccessMessage }
        </div>
      )
    }
  }, [userState.globalSuccessMessage, roomState.globalSuccessMessage])


  const logoutNow = useCallback(() => {
      dispatch(logout())
      window.location.href='/'
  }, [])

  const pageLoading = useMemo(() => {
    if (userState.isLoadingPage || roomState.isLoadingPage) {
      return (
        <div className='bg-purple-500 text-white text-lg w-full h-full fixed top-0 left-0 flex justify-center items-center'>
          {userState.isLoadingPage || roomState.isLoadingPage}
        </div>
      )
    }
  }, [userState.isLoadingPage, roomState.isLoadingPage])

  const inviteElement = useMemo(() => {
    if (invitingMe) {
      return (
        <div className='fixed top-0 left-0 w-full h-full flex justify-center items-center bg-purple-100/50'>
          <div className='rounded bg-purple-500 shadow-purple-400 p-3'>
            <p>Invitation room</p>

            <div className='text-center'>
              <button className='p-2 rounded bg-white text-purple-500'>
                ACCEPT
              </button>

              <button className='p-2 rounded bg-red-500 text-white'>
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )
    }
  }, [invitingMe])


  return (
    <div className="App bg-gray-50 relative py-5" style={{minHeight:'100vh'}}>
      <Router>
        {
          user ? <UserHeader user={user} logoutNow={logoutNow}/> : ''
        }
        <Routes>
          <Route path='' element={<Home/>}></Route>
          <Route path='/register' element={<Register/>}></Route>
          <Route path='/lobby' element={<Lobby/>}></Route>
          <Route path='/lobby/room' element={<Room/>}></Route>
        </Routes>
      </Router>
      {inviteElement}
      {pageLoading}
      {successMessage}
      {errorMessage}
    </div>
  )
}

export default React.memo(App)
