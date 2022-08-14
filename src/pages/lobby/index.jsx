import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { FaTrashAlt } from 'react-icons/fa'
import { MdPersonRemoveAlt1 } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import roomService from '../../features/room/roomService'
import { setProps as userSetProps } from '../../features/user/userSlice'
import { setProps as roomSetProps, deleteRoomById } from '../../features/room/roomSlice'

import { useNavigate } from 'react-router-dom'

import '../../assets/agora-rtm-sdk-1.4.5'
import { roomSlice } from '../../features/room/roomSlice'

let rtmClient, channel
const AGORA_APP_ID = "4b3a1d46ac90441c840669b7f31417bb" 
function index() {

    const userState = useSelector(state => state.user)
    const roomState = useSelector(state => state.room)
    const {
        user,
        isLoadingPage,
    } = userState

    const [Rooms, setRooms] = useState([])

    const [refresh, setRefresh] = useState(0)

    // Invitation data
    const [isInvitation, setInvitation] = useState(null)

    useEffect(() => {
        localStorage.setItem('roomMembers', JSON.stringify([]))
    }, [])

    const dispatch = useDispatch()
    const navigate = useNavigate()

    // RTM Instance
    const rtmInstance = async () => {
            
        rtmClient = await AgoraRTM.createInstance(AGORA_APP_ID)
        await rtmClient.login({
            uid: `${user.username}-${user.id}`, token:null
        })

        // Room for global
        channel = await rtmClient.createChannel('global')
        await channel.join()


        //Listen to users joined
        channel.on('MemberJoined', rtmHandleUserJoined)
        
        // Listen for the user left
        channel.on('MemberLeft', rtmHandleUserLeft)

        // Listen to all messages from the room
        channel.on('ChannelMessage', rtmHandleMessageFromPeer)

        window.addEventListener('beforeunload', async () => {
            alert("LOGOUT")
            await logout()
        })
    }

    const logout = async () => {
        await rtmClient.logout()
        await channel.leave()
    }

    const rtmHandleUserJoined = MemberID => {

    }

    const rtmHandleUserLeft = MemberID => {

    }

    const rtmHandleMessageFromPeer = (message, MemberID) => {
        message = JSON.parse(message.text)

        // Listen messages from users
        if (message.to === `${user.username}-${user.id}`) {
            if (message.type === 'listen-invite') {
                setInvitation(inv => ({
                    from: message.from,
                    to: message.to,
                    roomID: message.roomID
                }))
            }
            
            // Listen the my inivitaion declined by user
            if (message.type === `listen-declined`) {
                alert(`Your invitation was declined by ${message.from} `)
            }

            if (message.type === `listen-accepted`) {
                alert(`Your invitation was accepted by ${message.from}`)
            }
            
        }

        // Listen messages from users
        if (message.toArr && message.toArr.includes(user.username) ) {
            if (message.type === 'room-deleted') {
                setRefresh(ref => {
                    ref += 1
                    return ref
                })
            }
        }
    }

    

    useEffect(() => {
        // Get rooms
        async function loaders() {
            let rooms = await roomService.getMyRooms(user.username)
            console.log(rooms)
            setRooms(rooms)

            rtmInstance()
        }

        loaders()
    }, [refresh])

    const joinRoom = () => {
        const roomid = document.getElementById('roomid').value
        if(!roomid) {
            return dispatch(userSetProps({...userState, globalErrorMessage: 'Room ID is empty'}))
        }
        window.location.href = `/lobby/room?id=${roomid}`
    }

    const createRoom = async (e) => {
        dispatch(userSetProps({...userState, isLoadingPage: 'Creating room please wait...'}))

        const newRoom = await roomService.createRoom({
            admin: user.username,
            roomName: document.getElementById('roomid').value
        })

        if (newRoom) {
            window.location.href = `/lobby/room?id=${newRoom.roomID}`
        } else {
            dispatch(userSetProps({...userState, globalErrorMessage: 'Something wrong creating room..'}))
        }
    }

    const deleteRoom = async (_id) => {
        dispatch(deleteRoomById(_id))
        document.getElementById(_id).remove()

        const room = Rooms.find(r => r._id == _id)
        channel.sendMessage({
            text: JSON.stringify({
                toArr: room.participants,
                type:'room-deleted'
            })
        })
    }

    const leaveRoom = async (roomID) => {
        await roomService.leaveRoom(roomID, user.username)

        setRefresh(ref => {
            ref += 1
            return ref
        })
    }


    const declineInvite = useCallback(() => {
        const { from, to, roomID } = isInvitation
        channel.sendMessage({
            text: JSON.stringify({
                type: 'listen-declined', to:from, from:`${user.username}-${user.id}`
            })
        })

        setInvitation(null)
    }, [isInvitation])


    const acceptInvite = useCallback(async () => {
        const { from, to, roomID } = isInvitation
        channel.sendMessage({
            text: JSON.stringify({
                type: 'listen-accepted', to:from, from:`${user.username}-${user.id}`
            })
        })

        // Save to database
        await roomService.addParticipants(roomID, user.username)

        window.location.href = `/lobby/room?id=${roomID}`

        
    }, [isInvitation])


    const inivitationModal = useMemo(() => {
        if (isInvitation) {
            return (
                <div className='fixed top-0 left-0 bg-purple-300/50 w-full h-full flex justify-center items-center'>
                   <div className='bg-purple-500 p-3 rounded text-white w-1/2'>
                        <h1 className='text-lg text-bold '>Room ({isInvitation.roomID}) Invitation from {isInvitation.from}</h1>

                        <div className='flex justify-center gap-1'>
                            <button onClick={() => declineInvite()} className='px-2 py-1 rounded bg-red-500 text-white'>
                                DECLINE
                            </button>

                            <button onClick={() => acceptInvite()} className='px-2 py-1 rounded bg-white text-purple-700'>
                                ACCEPT
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    }, [isInvitation])


    const roomsElement = () => {
        return Rooms.map(room => {
            return (
                <div key={room._id} id={room._id} className='flex justify-between px-3 py-1 rounded bg-purple-500 text-white items-center mb-3'>
                    <div>
                        {room.roomName}
                        <br />
                        <small className='text-sm text-purple-100'>{room.participants.length} participants</small>
                    </div>
    
                    <div className='flex items-center'>
                        {
                            room.admin === user.username ? (
                                <button title='Delete room' onClick={() => deleteRoom(room._id)} className='p-2 rounded-full hover:bg-red-500  '>
                                    <FaTrashAlt/>
                                </button>
                            ) : null
                        }

                        <button onClick={() => leaveRoom(room.roomID)} title='Leave room' className='p-2 mx-2 rounded-full shadow hover:bg-red-500' >
                            <MdPersonRemoveAlt1/>
                        </button>

                        <button  onClick={() => navigate(`/lobby/room?id=${room.roomID}`)} className='text-sm bg-purple-100 p-1 rounded text-purple-500 mx-3'>
                            JOIN
                        </button>
    
                        <button className='p-2 rounded-full bg-red-700 shaodw-red-500 shadow'></button>
                        
                    </div>
                </div>
            )
        })
    }
    

    if(user) {
        return (
            <div className='container mx-auto px-4 font-mono'>
                <div>
                    <h1 className='text-lg'>Join Room</h1>
                    <div className='flex items-center'>
                        <input placeholder='Enter room name' type="text" id="roomid" className='bg-purple-100 p-1 text-purple-500'/>
                        <button onClick={joinRoom} className='text-sm px-3 py-1 bg-purple-500 text-white rounded mx-2'>JOIN</button>
                        <button onClick={createRoom} className='text-sm px-3 py-1 bg-purple-500 text-white rounded mx-2'>CREATE</button>
                    </div>
                </div>


                <div id="rooms" className="">
                    <h1 className='text-lg'>ROOMS</h1>
                    <div className='flex justify-between px-3 py-1 rounded bg-purple-500 text-white items-center mb-3'>
                        <div>
                            Global room
                            <br />
                            <small className='text-sm text-purple-100'>5 participants</small>
                        </div>

                        <div className='flex items-center'>
                            <button onClick={() => navigate('/lobby/room?id=123')} className='text-sm bg-purple-100 p-1 rounded text-purple-500 mx-3'>
                                JOIN
                            </button>

                            <button className='p-2 rounded-full bg-red-700 shaodw-red-500 shadow'></button>
                        </div>
                    </div>

                    { roomsElement() }
                    { inivitationModal }
                </div>
            </div>
        )
    } else {
        useEffect(() => {
            navigate('/')
        }, [user])
    }
}

export default React.memo(index)