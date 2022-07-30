
import React, { useEffect, useMemo, useCallback } from 'react'

import './App.css'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/index.jsx'
import Register from './pages/register'
import Lobby from './pages/lobby'
import Room from './pages/lobby/room'

// Store
import { useSelector, useDispatch } from 'react-redux'
import { setMessage, logout } from './features/user/userSlice'

//Layout
import UserHeader from './components/layout/userHeader'


function App() {
  
  const userState = useSelector(state => state.user)
  const {
      isLoading,
      message,
      user
  } = userState


  const dispatch = useDispatch()
  
  let newMessage = useMemo(() => {
    if(message) {
      setTimeout(() => dispatch(setMessage("")), 4000)
      return (
        <div className="border-4 border-red-500 bg-red-200 white rounded text-red-500 p-5 w-1/2 mx-auto">
          {message}
        </div>
      )
    }
  }, [message])


  const logoutNow = useCallback(() => {
      dispatch(logout())
      window.location.href='/'
  }, [])


  return (
    <div className="App">
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
      {newMessage}
    </div>
  )
}

export default React.memo(App)
