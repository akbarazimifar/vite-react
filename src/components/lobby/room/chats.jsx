import React from 'react'
import { useCallback } from 'react'

function chats({chatList = [], roomName = 'Room Name', setClose, username, newMessage}) {


  const submitMessage = useCallback((e) => {
    e.preventDefault()
    const message = document.getElementById('message').value

    if (message) {
      newMessage({
        username, 
        message
      })

      document.getElementById('message').value = ''
    }
  }, [])

  return (
    <div className='fixed top-0 left-0 w-full h-full bg-purple-100/20'>
      <div className='bg-purple-700 shadow text-white w-1/3 xs:w-80 sm:w-80 absolute right-0 top-0 h-full p-3 font-mono'>
          <div className='flex justify-between items-center'>
            <p className='text-lg font-bold'>{roomName}</p>

            <button onClick={() => setClose()} className='text-purple-700 bg-white rounded text-sm px-2 py-1'>
              CLOSE
            </button>
          </div>

          <div className='h-4/5 overflow-y-scroll w-100 break-words my-5'>
            {/* <div className='flex'>
              <div className='bg-white text-purple-800 rounded-lg p-2 w-80 max-h-none flex-shrink-0 break-words'>
                <p className='font-bold'>🤖 Hello from bot</p>

                <p className='text-sm'>
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit. At, a!
                </p>
              </div>
            </div> */}

            {
              chatList.map(chat => {
                return (
                  <div className={`flex mb-1 ${chat.username === username  ? 'flex-row row-end-1' : ''}`}>
                    <div className='bg-white text-purple-800 rounded-lg p-2 w-80 max-h-none flex-shrink-0 break-words'>
                      <p className='font-bold'>{chat.username === 'Robot' ? '🤖' : '😎'} {chat.fullname}</p>

                      <p className='text-sm'>
                        {chat.message}
                      </p>
                    </div>
                </div>
                )
              })
            }
          </div>

          <form onSubmit={submitMessage} className='flex justify-between items-center absolute bottom-3 w-full  '>
            <div className='w-full '>
              <input type="text" id='message' placeholder='Send message' className='w-full rounded-lg shadow bg-white text-purple-800 p-2'/>
            </div>

            <div className='flex-none mx-5'>
              <button className='bg-purple-400 text-white p-2 rounded '>
                SEND
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}

export default React.memo(chats)