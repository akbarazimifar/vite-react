import React from 'react'

function userHeader({user, logoutNow}) {
  return (
    <div className='border-b-4 border-purple-600 text-lg flex justify-between items-center py-3 container mx-auto px-4 font-mono'>
        <div>
            <span className='text-purple-500'>Welcome</span> {user.username} 
        </div>
        <button className='bg-purple-500 px-3 py-1 text-purple-100 rounded shadow-sm' onClick={() => logoutNow()}>LOGOUT</button>
    </div>
  )
}

export default userHeader