import React from 'react'
import { useMemo, useState } from 'react'
import { FaUserCircle } from 'react-icons/fa'
function userHeader({user, logoutNow}) {

  const [isMenu, setMenu] = useState(false)

  const Menu = useMemo(() => {
    if (isMenu) {
      return (
        <div className='bg-purple-800 border shadow absolute top-10 z-20 p-2 rounded w-auto'>
          <div>
            <span className='text-sm'>
              {user.username}
            </span>
          </div>
          <div>
            <button className='xs:text-sm bg-purple-500 px-3 py-1 text-purple-100 rounded shadow-sm' onClick={() => logoutNow()}>LOGOUT</button>  
          </div>
        </div>
      )
    }
  }, [isMenu])

  return (
    <div className='
        z-10
        border-b-4 
        border-purple-600 
        font-mono
        bg-gradient-to-r from-purple-800 via-purple-800 to-violet-900
        text-white
        w-full
        fixed
        top-0
        left-0
        flex
        justify-center
      '>
        <div className='
          container
          text-lg flex 
          justify-between 
          items-center 
          w-full
          py-2
        '>
          <div>
            <span className='text-purple-200 font-bold'>RARACHAT</span> 
          </div>

          <div className='flex items-center '>
            <span className='text-sm mx-2'>
              {user.username}
            </span>
            <FaUserCircle onClick={() => setMenu(!isMenu)}/>
            {Menu}
          </div>
          {/* <button className='xs:text-sm bg-purple-500 px-3 py-1 text-purple-100 rounded shadow-sm' onClick={() => logoutNow()}>LOGOUT</button> */}
        </div>
    </div>
  )
}

export default userHeader