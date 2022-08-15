import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FaThumbsUp, FaThumbsDown, FaMicrophone, FaCamera, FaSignOutAlt, FaWindowClose, FaUsers, FaRegGrinStars} from 'react-icons/fa'
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from 'react-icons/md'
//Agora SDK for our Realtime Connection
import '../../../assets/agora-rtm-sdk-1.4.5'

//Agora for Video Call
import '../../../assets/AgoraRTC_N-4.13.0'

import userService from '../../../features/user/userService'
import { useNavigate } from 'react-router-dom'
import roomService from '../../../features/room/roomService'
import { setProps } from '../../../features/user/userSlice'
// import loadScript from '../../../hooks/loadScript'
// import { baseUrl } from '../../../features/requests'
// Constant vars
// RTC
let localTracks = []
let localScreenTracks = null
let client = null

// RTM
let rtmClient
let channel
let globalChannel


// Controls
// let isShareScreen = null
// let userSpot = null

function Room() {

    // // Load RTM
    // loadScript(`${baseUrl}/AgoraRTM`)

    // // Load RTC
    // loadScript(`${baseUrl}/AgoraRTC`)

    // Redux
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const userState = useSelector(state => state.user)
    const {
        user,
    } = userState
    
    
    try {
        let s = user.id
    } catch (err) {
        window.location.href = '/'
    }
    
    console.warn(user.token)

    // My data
    const [myData, setMydata] = useState(null)

    // Room data
    const [roomData, setRoom] = useState(null)

    // Invite Data
    const [isInvite, setInvite] = useState(false)
    const [Users, setUsers] = useState([])

    // Invitation data
    const [isInvitation, setInvitation] = useState(null)

    // My devices
    let [cameraMuted, setCamera] = useState(false)
    let [audioMuted, setAudio] = useState(true)


    // FOR AGORA VARS
    const AGORA_APP_ID = "4b3a1d46ac90441c840669b7f31417bb" // RTC
    const RTM_ID = '4b3a1d46ac90441c840669b7f31417bb'
    const token = null 
    const [uid, setUid] = useState(user.id) // My uniqie ID for Peering, later it will be the USER LOGGED ID
    let rtmUid = String(`${user.username}-${user.id}`)
    // Media
    let [remoteUsers, setremoteUsers] = useState({})

    // Controls
    let [userSpot,  setSpot] = useState(null)
    let [isShareScreen, setShareScreen] = useState(null)

    let [allowControl, setAllowControl] = useState(0)


    console.log("TANGINA MO REACT")

    useEffect(() => {
        
    }, [])


    function scriptLoaded() {
        window.A.sort();
    }

    let init = async () => {

        // -------- STEP 1 ---------
        //Get current room
        const params = new URLSearchParams(window.location.search)
        const roomID = params.get("id")

        if (!roomID) {
            return navigate("/lobby")
        }

        // Get room data
        if (roomID === '123') {
            setRoom({
                roomName:'Global room',
                roomID:'123',
            })
        } else {
            const room = await roomService.getRoomById(roomID, user.username)
            setRoom(room)

            console.warn("ROOM DATA",room)
            if (!room) {
                dispatch(setProps({...userState, globalErrorMessage:"Room not exist"}))
                return navigate('/lobby')
            }
        }
        
        
        // RTM Instance
        const rtmInstance = async () => {
            
            rtmClient = await AgoraRTM.createInstance(AGORA_APP_ID)
            await rtmClient.login({
                uid: rtmUid, token
            })

            // Room with uniqe room ID
            channel = await rtmClient.createChannel('chat-'+roomID)
            await channel.join()


            // Room for global
            globalChannel = await rtmClient.createChannel('global')
            await globalChannel.join()


            //Listen to users joined
            channel.on('MemberJoined', rtmHandleUserJoined)
            
            // Listen for the user left
            channel.on('MemberLeft', rtmHandleUserLeft)

            // Listen to all messages from the room
            channel.on('ChannelMessage', rtmHandleMessageFromPeer)

            // Listen for the invites
            globalChannel.on('ChannelMessage', rtmGlobalMessageFromPeer)


            window.addEventListener('beforeunload', async () => {
                alert("LOGOUT")
                await logout()
            })
        }

        

        // RTC Instance
        const rtcInstance = async () => {
            
            client = await AgoraRTC.createClient({
                mode:'rtc', codec:'vp8'
            })
            
            await client.join(AGORA_APP_ID, roomID,  token, uid)
            // Listen for other users join in that room
            client.on('user-published', handleUserPublished)

            // Listen for the user left
            client.on('user-left', handleUserLeft)
        }

        await rtmInstance()

        await rtcInstance()

        joinStream()
    }

    const joinStream = async () => {
        // Agora ask for my device
        localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
            encoderConfig: {
                width: {
                    min: 640, ideal: 1920, max: 1920
                },
                height:{ 
                    min: 480, ideal:1080, max: 1080
                }
            },

            optimizationMode: "detail"
        })

        // Initiate my own Video container
        addNewVideo(uid)
        await localTracks[1].play(`user-${uid}`)


        // Publish my local tracks to trigger the user-published
        await client.publish([localTracks[0], localTracks[1]])

        // Default device state
        await localTracks[1].setMuted(false)
        setCamera(cam => (localTracks[1].muted))
        cameraMuted = localTracks[1].muted

        await localTracks[0].setMuted(true)
        setAudio(aud => (localTracks[0].muted))
        audioMuted = localTracks[0].muted
        
         
    }

    const logout = async () => {
        await rtmClient.logout()
        await channel.leave()
    }

    // Handlers
    const handleUserPublished = useCallback(async (userMedia, mediaType) => {
        
        // Store the user information
        // setremoteUsers({...remoteUsers, [userMedia.uid]: user})

        // Accept user to the peer chat
        await client.subscribe(userMedia, mediaType)

        // Create video container for the new user
        addNewVideo(userMedia.uid)

        const newUser = await userService.getUserByUID({
            ...user,
            uid: userMedia.uid
        })

        newUser.isAudioMuted = !userMedia.hasAudio
        newUser.isCameraMuted = !userMedia.hasVideo
        
        setremoteUsers(Users => {
            console.warn("USERS PUBLISH: ", Users)
            return {...Users, [newUser.id]: newUser}
        })

        if (mediaType === 'video') {
            userMedia.videoTrack.play(`user-${userMedia.uid}`)
        }
        

        setShareScreen(sharer => {
            // if share screen
            if (sharer && mediaType === 'video') {

                // Ako ung naka sharescreen pero may pumasok lang na iba
                if (`user-sharescreen-${user.id}` === sharer) {

                    // ung pumasok is play naten sa loob ng videos
                    userMedia.videoTrack.play(`user-${userMedia.uid}`)
                    // As new joined user 
                    channel.sendMessage({
                        text: JSON.stringify({
                            type: 'current-sharer', isShareScreen: sharer, to: userMedia.uid
                        })
                    })
                } else {
                    userMedia.videoTrack.play(sharer)
                }

            } 
            return sharer
        })

        
        if (mediaType === 'audio') {
            userMedia.audioTrack.play()
        }


        
    }, [isShareScreen, userSpot, myData, remoteUsers])

    let handleUserLeft = (user) => {
        // Delete the user for the participants variable
        setremoteUsers(Users => {
            let users = Users
            delete users[user.uid]
            return {...users}
        })
        

        // Delete the user video container
        document.getElementById(`user-container-${user.uid}`).remove()
    }

    //RTM

    const rtmHandleUserJoined = async (MemberID) => {

    }
    
    const rtmHandleUserLeft = async (MemberID) => {
        console.warn(`${MemberID} was left`)
        
    }


  

    //DOME ACTIONS
    const openSpotlightDom = videoId => {
        //if(!videoId) alert("WALANG VIDEO ID: ", videoId)
        userSpot = videoId
        let spotlight = document.getElementById('spotlight')
        spotlight.style.height = '50vh !important'

        let child = spotlight.firstElementChild
        if (child) {
            document.getElementById('videos').appendChild(child)
        }

        // get the user video element then display to all
        let videoElement = document.getElementById(videoId)
        spotlight.appendChild(videoElement)
    }

    const closeShareScreenDom = () => {
        let spotlight = document.getElementById('spotlight')
        
        // Remove element for sharescreen
        spotlight.innerHTML = ''
        spotlight.style.height = '0px !important'
    }


    const closeSpotLightDom = () => {
        let spotlight = document.getElementById('spotlight')
        let child = spotlight.firstElementChild
        if (child) {
            document.getElementById('videos').appendChild(child)
        }
        spotlight.style.height = '0px !important'
        userSpot = null
    }

    const setShareScreenDom = (memberID) => {
        let child = spotlight.firstChild
        if(child && userSpot && !isShareScreen) {
            document.getElementById('videos').appendChild(child) 
        }
        
        spotlight.style.height = '50vh !important'

        if(!child) {
            spotlight.insertAdjacentHTML('beforeend',  `
                <div key="${memberID}" id="user-container-${memberID}" class='text-center user-video' >
                    <div class='video-container aspect-square w-50 bg-purple-300 border-2 border-purple-700 rounded-full' id="user-sharescreen-${memberID}" >
                    </div>
                </div>
            `)
        }
        
    }
    
    const rtmHandleMessageFromPeer = useCallback( async (message, MemberID) => {
        message = JSON.parse(message.text)
        
        console.warn("MAY NAG MESSAGE ", message)
        if (message.type === 'spotlight') {
            setSpot(i => (message.videoId))
            userSpot = message.videoId
            openSpotlightDom(message.videoId)
        }

        if (message.type === 'close-spotlight') {
            setSpot(i => (null))
            userSpot = null
            closeSpotLightDom()
        }


        if (message.type === 'sharescreen') {
            setShareScreen(i => (`user-sharescreen-${message.uid}`))
            isShareScreen = `user-sharescreen-${message.uid}`

            setSpot(i => (null))
            userSpot = null
            // setSpot(i => (`user-container-${message.uid}`))
            setShareScreenDom(message.uid)
        }

        if (message.type === 'close-sharescreen') { //userVideo
            setSpot(i => (message.userSpot))
            userSpot = message.userSpot
            // delete sharer element
            document.getElementById('spotlight').innerHTML = ''

            setShareScreen(i => (null))
            isShareScreen = null
            
            closeShareScreenDom()
            
            // set spotlight the recent sharer
            alert(message.userSpot)
            let userVideo = document.getElementById(message.userSpot)
            document.getElementById('spotlight').appendChild(userVideo)
            
        }

        if (message.type === 'user-camera') {
            const { id, camera } = message
            console.warn(`${username} if muted ${audio}`)

            setremoteUsers(Users => {
                let users = Users

                users[id].isCameraMuted = camera

                return {...users}
            })
        }

        if (message.type === 'user-audio') {
            const { id, audio } = message
            console.warn(`${id} if muted ${audio}`)

            setremoteUsers(Users => {
                let users = Users

                users[id].isAudioMuted = audio

                if (users[id].isAudioMuted) {
                    // is muted
                    document.getElementById(`user-${id}`).classList.remove('audioOn')
                } else {
                    document.getElementById(`user-${id}`).classList.add('audioOn')
                }
                return {...users}
            })
            
        }


        // Listen onyl for new user joined
        if (message.to === user.id) {

            if (message.type === 'current-sharer' ) {
                alert(`CURRENT SHARER: ${message.isShareScreen}`)
                setShareScreen(i => (message.isShareScreen))
                isShareScreen = message.isShareScreen
            }

        }
        
    }, [])


    const rtmGlobalMessageFromPeer = useCallback( async (message, MemberID) => {
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


        if (message.toArr && message.toArr.includes(user.username) ) {
            if (message.type === 'room-deleted') {
                alert(`Sorry, this room is now deleted by the admin`)
                window.location.href = '/lobby'
            }
        }

    }, [])

   



    let setSpotlight = useCallback(async (e) => {

        if(!allowControl) {
            return alert("Unable to control spotlight: " + e.currentTarget.id)
        } 

        if(isShareScreen) {
            return alert("Someone presenting")
        }

        const userVideoId = e.currentTarget.id
        
        const newMessage = JSON.stringify({
            type: 'spotlight', videoId: userVideoId,
        })
        channel.sendMessageToPeer({
            text: newMessage
        }, rtmUid)

    }, [allowControl, isShareScreen])

    // Close spotlight
    const closeSpotlight = useCallback(() => {
        // ONly me can close my own spotligth
        console.log(userSpot)
        if(userSpot === `user-container-${uid}`) {
            //alert(`Im closing my spotlight`)
            const userVideoId = userSpot
            const newMessage = JSON.stringify({
                type: 'close-spotlight', videoId: userVideoId,
            })

            channel.sendMessage({
                text: newMessage
            })

            closeSpotLightDom()
            setSpot(i => (null))
            console.log(userSpot)
        }
        
    }, [isShareScreen, userSpot])

    // Set me as spotlight 
    const setMeSpot = useCallback(() => {

        if (isShareScreen) {
            return alert("Someone presenting")
        }

        if(userSpot && userSpot !== `user-container-${uid}`) {
            return alert("Someone presenting")
        }

        const userVideoId = `user-container-${uid}`
        const newMessage = JSON.stringify({
            type: 'spotlight', videoId: userVideoId,
        })
        channel.sendMessage({
            text: newMessage
        })

        setSpot(i => (`user-container-${uid}`))

        openSpotlightDom(userVideoId)
    }, [userSpot])


    const changeAudio = async (e) => {
        const audio = !localTracks[0].muted
        await localTracks[0].setMuted(audio)

        // Send what I update
        channel.sendMessage({
            text: JSON.stringify({
                type:'user-audio', id: user.id, audio
            })
        })

        // Change my state in my own
        setremoteUsers(Users => {
            let users = Users

            users[uid].isAudioMuted = audio

            if (users[uid].isAudioMuted) {
                // is muted
                document.getElementById(`user-${uid}`).classList.remove('audioOn')
            } else {
                document.getElementById(`user-${uid}`).classList.add('audioOn')
            }
            return {...users}
        })

        
    }

    const changeCamera = async (e) => {
        const camera = !localTracks[1].muted
        await localTracks[1].setMuted(camera)

        // Change my state in my own
        setremoteUsers(Users => {
            Users[user.id].isCameraMuted = camera
            return Users
        })

        // Send what I update
        channel.sendMessage({
            text: JSON.stringify({
                type:'user-camera', id: user.id, camera
            })
        })
    }


    // Toggle listener
    let toggleAudio = () => {
        changeAudio()
        setAudio(aud => (localTracks[0].muted))
    }

    let toggleCamera = () => {
        changeCamera()
        setCamera(cam => (localTracks[1].muted))
    }

    

    let toggleScreen = useCallback(async (e) => {
        
        // Start to insert Screen sharing video element

        let userSpotligght = false
        setSpot(spot => {
            userSpotligght = spot
            return spot 
        })
        if(userSpotligght && userSpotligght !== `user-container-${user.id}`) {
            return alert("Someone presenting spotlight")
        }

        closeSpotlight()

        if (isShareScreen === `user-sharescreen-${uid}`) {
            //alert("mag cloclose")

            
            channel.sendMessage({
                text: JSON.stringify({
                    type: 'close-sharescreen',
                    userSpot: `user-container-${uid}`,
                })
            })
            
            setShareScreen(i => (null))
            isShareScreen = null

            setSpot(i => (`user-container-${uid}`))
            userSpot = `user-container-${uid}`

            // Close sharescreen
            closeShareScreenDom()

            // switch me as a spotlight
            setMeSpot()


            // Kill sharescreen
            await client.unpublish([localScreenTracks])

            // add my own user container while share screening
            addNewVideo(uid)

            // play my camera to them
            await localTracks[1].play(`user-${uid}`)

            // Publish my local tracks to trigger the user-published
            await client.publish([localTracks[0], localTracks[1]])

            //alert("na closed")
            return 
        }

        if (!isShareScreen) {

            // Message them to create my element to play my share screening
            channel.sendMessage({text: JSON.stringify({
                type:'sharescreen', uid: uid, 
            })})

            setShareScreen(i => (`user-sharescreen-${uid}`))
            isShareScreen = `user-sharescreen-${uid}`

            setSpot(i => (null))
            userSpot = null

            
            // creata the share screen element to my page
            setShareScreenDom(uid)

            // Clear all sharescreen tracks
            await client.unpublish();

            // Initiate the sharescreen action
            localScreenTracks = await AgoraRTC.createScreenVideoTrack()
            // play and publish
            localScreenTracks.play(`user-sharescreen-${uid}`)
            // Share screen and video
            await client.publish([localScreenTracks])
            

            //Reinitiate my camera and play to all users
            addNewVideo(uid)
            // await localTracks[1].play(`user-${uid}`)

            // // Publish my local tracks to trigger the user-published
            //await client.publish([localTracks[0], localTracks[1]])
            
            

            return 
        }
    }, [userSpot, isShareScreen])


    const inviteNow = async (MemberID) => {
        globalChannel.sendMessage({
            text: JSON.stringify({
                type: 'listen-invite', to: MemberID, from: `${user.username}-${user.id}`, roomID: roomData.roomID
            })
        })

        setInvite(false)
    }

    const declineInvite = useCallback(() => {
        const { from, to, roomID } = isInvitation
        globalChannel.sendMessage({
            text: JSON.stringify({
                type: 'listen-declined', to:from, from:`${user.username}-${user.id}`
            })
        })

        setInvitation(null)
    }, [isInvitation])


    const acceptInvite = useCallback(async () => {
        const { from, to, roomID } = isInvitation
        globalChannel.sendMessage({
            text: JSON.stringify({
                type: 'listen-accepted', to:from, from:`${user.username}-${user.id}`
            })
        })

        // Save to database
        await roomService.addParticipants(roomID, user.username)

        window.location.href = `/lobby/room?id=${roomID}`

        
    }, [isInvitation])



    const gotoLobby = useCallback(async () => {
        
        window.location.href = '/lobby'
    }, [])

    const loadVideoEvents = useCallback(() => {      
        let videos = document.getElementsByClassName('user-video')  
        for(let i = 0; videos.length > i; i++) {
            videos[i].onclick = setSpotlight
        }
    }, [remoteUsers])


    // Loaders 
    useEffect(() => {
        async function loads() {
        
            await init()

            let result = await userService.getUserByUsername(user)
            console.warn(result)

            result.isAudioMuted = audioMuted
            result.isCameraMuted = cameraMuted
            

            // Insert my data
            setremoteUsers(Users => ({...Users, [result.id]: result}))
            setMydata(result)

            // As new joined member, check the userspot and sharescreen
            channel.sendMessage({ 
                text: JSON.stringify({
                    type: 'room-state', uid: user.id
                })
            })

            
        }

        loads()
    }, []) 

    useEffect(() => {
        //alert("NABAGO ANG REMOTE USERS")
        for (let u in remoteUsers) {
            let nameDom = document.getElementById(`fullname-${u.id}`)
            if  (nameDom) {
                nameDom.innerText = uid === u.id ? 'You' : u.username
            }
        }
      
        console.warn(`USERS`, remoteUsers)
    }, [remoteUsers])


    useEffect(() => {
        loadVideoEvents()
    }, [allowControl])



    // Dynamic video element
    const addNewVideo = useCallback(async (member) => {
        
        let video = document.getElementById(`user-container-${member}`)
        let videos = document.getElementById('videos')
        if (!video) {
            videos.insertAdjacentHTML('beforeend', `
                <div key="${member}" id="user-container-${member}" class='text-center user-video' >
                    <div class='video-container aspect-square w-50 bg-purple-300 border-2  rounded-full' id="user-${member}" >
                    </div>
                    <small id="fullname-${member}" class='text-sm text-purple-500'>${member}</small>
                </div>
            `)
        }
    }, [remoteUsers])

    let spotlightToggle = () => {
        
        if (isShareScreen || userSpot !== `user-container-${uid}`) {
            return (
                <button onClick={setMeSpot} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <FaRegGrinStars />
                </button>
            )
        }
        
        return (
            <button onClick={closeSpotlight} className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                <FaRegGrinStars />
            </button>
        )
       
    }

    let shareScreenToggle = useMemo(() => {

        if (!isShareScreen) {
            return (
                <button onClick={toggleScreen} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <MdOutlineStopScreenShare />
                </button>
            )
        }

        if (isShareScreen !== `user-sharescreen-${uid}`) {
            return (
                <button onClick={toggleScreen} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <MdOutlineStopScreenShare />
                </button>
            )
        }

        return (
            <button onClick={toggleScreen} className=' shadow-purple-400 rounded text-white border-2 border-purple-700 bg-purple-700 p-3'>
                <MdOutlineScreenShare />
            </button>
       )
    }, [isShareScreen])


    let allowAllSpotlightControl = useMemo(() => {
        if(uid.username !== 'marktomarse@gmail.com') {
            return 
        }
        if (allowControl) {
            return (
                <button onClick={() => setAllowControl(0)} className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaThumbsUp />
                </button>
            )
        } else {
            return (
                <button onClick={() => setAllowControl(1)} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <FaThumbsDown/>
                </button>
            )
        }
    }, [allowControl]) 

    let cameraToggle = useMemo(() => {
        if (!cameraMuted) {
            return (
                <button onClick={toggleCamera} className={` shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3`}>
                    <FaCamera/>
                </button>
            )
        } else {
            return (
                <button onClick={toggleCamera} className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaCamera/>
                </button>
            )
        }
    }, [cameraMuted])


    let audioToggle = useMemo(() => {
        if (audioMuted) {
            return (
                <button onClick={toggleAudio} className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaMicrophone/>
                </button>
            )
        }

        return (
            <button onClick={toggleAudio} className={` shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3`}>
                <FaMicrophone/>
            </button>
        )
    }, [audioMuted])

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
 
    const inviteModal = useMemo(() => {
        if(isInvite) {
            return (
                <div className='fixed top-0 left-0 bg-purple-300/50 w-full h-full flex justify-center items-center'>
                    
                    <button onClick={() => setInvite(false)} className='fixed top-5 right-5 rounded-full text-purple-600 text-5xl'>
                        <FaWindowClose/>
                    </button>
    
                    <div className='bg-purple-500 p-3 rounded text-white w-1/2'>
                        Invite users | 
                        <small> Onlines</small>
                        <div className='h-50 border-t-2 border-white my-3 '>
                            {
                                Users.map(user => (<div key={user} className='bg-white text-purple-500 rounde mb-1 p-2 flex justify-between items-center'>
                                    <span>{user.split('-')[0]}</span>
                
                                    <button onClick={() => inviteNow(user)} className='text-white p-1 bg-purple-500 rounded text-sm'>
                                        INVITE
                                    </button>
                                </div>))
                            }
                        </div>
                    </div>
                </div>
            )
        }
    }, [isInvite, Users])

    useEffect(() => {
        async function loaders() {
            let result = await globalChannel.getMembers()
            let currentRoomMembers = await channel.getMembers()
            // result = result.map(user => user.split('-')[0])
            result = result.filter(s => s.split('-')[0] !== user.username && !currentRoomMembers.includes(s))
            
            setUsers(i => {
                return [...result]
            })
        }

        if (isInvite) {
            loaders()
            
        } else {
            setUsers(i => {
                return []
            })
        }
    }, [isInvite])



    let usersLength = useMemo(() => {
        var count = 0;
        for (var k in remoteUsers) if (remoteUsers.hasOwnProperty(k)) ++count;

        return count
    }, [remoteUsers])
    
   if(user) {
        return (
            <div className=' font-mono h-full' id='roompage'>
                <div className='border-b-2  bg-purple-100 border-purple-600 mb-5' id="spotlight">
                    
                </div>

                <div className='flex gap-2 justify-center' id='videos'>
                </div>


                {/* <p className='text-lg text-center'>
                    Sharing screen: {isShareScreen}
                    <br />
                    Spotting light: {userSpot}
                </p> */}

                
                <div className='fixed bottom-3 inset-x-1/2 mx-auto  flex gap-2 justify-center'>
                    { audioToggle }

                    { cameraToggle }

                    { spotlightToggle() }

                    { allowAllSpotlightControl }

                    { shareScreenToggle }

                    {
                        roomData && roomData.admin === user.username ? (
                            <button onClick={() => setInvite(true)} className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                                <FaUsers/>
                            </button>
                        ) : null
                    }

                    <button onClick={gotoLobby} className={` shadow-red-400 rounded text-white bg-red-700 border-2 border-red-700 p-3`}>
                        <FaSignOutAlt/>
                    </button>
                </div>

                {inviteModal}
                {inivitationModal}
            </div>
        )
    } else {
        window.location.href = '/'
    }
} 

export default React.memo(Room)