import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FaThumbsUp, FaThumbsDown, FaMicrophone, FaCamera, FaMicrophoneAltSlash, FaRegTimesCircle, FaRegGrinStars} from 'react-icons/fa'
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from 'react-icons/md'
//Agora SDK for our Realtime Connection
import '../../../assets/agora-rtm-sdk-1.4.5'

//Agora for Video Call
import '../../../assets/AgoraRTC_N-4.13.0'

import userService from '../../../features/user/userService'

// Constant vars
// RTC
let localTracks = []
let localScreenTracks = null
let client = null

// RTM
let rtmClient
let channel


// Controls
// let isShareScreen = null
// let userSpot = null

function Room() {

    // Redux
    const dispatch = useDispatch()
    const userState = useSelector(state => state.user)
    const {
        user,
    } = userState
    
    console.warn(user.token)
    
    try {
        let s = user.id
    } catch (err) {
        window.location.href = '/'
    }
    

    // My data
    const [myData, setMydata] = useState({})

    // Users data list
    const [Users, setUsers] = useState([])

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
    let [userSpot,  setSpot] = useState()
    let [isShareScreen, setShareScreen] = useState(null)

    let [allowControl, setAllowControl] = useState(0)


    console.log("TANGINA MO REACT")



    let init = async () => {
        // -------- STEP 1 ---------
        //Get current room
        const params = new URLSearchParams(window.location.search)
        const roomID = params.get("id")

        // RTM Instance
        const rtmInstance = async () => {
            
            rtmClient = await AgoraRTM.createInstance(AGORA_APP_ID)
            await rtmClient.login({
                uid: rtmUid, token
            })

            // Room with uniqe room ID
            channel = await rtmClient.createChannel('chat-'+roomID)
            await channel.join()


            //Listen to users joined
            channel.on('MemberJoined', rtmHandleUserJoined)
            
            // Listen for the user left
            channel.on('MemberLeft', rtmHandleUserLeft)

            // Listen to all messages from the room
            channel.on('ChannelMessage', rtmHandleMessageFromPeer)

            window.addEventListener('beforeunload', async () => {
                await rtmClient.logout()
                await channel.leave()
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
        
        // Toggle listener
        document.getElementById('btn-cam').addEventListener('click', e => {
            changeCamera()
            setCamera(cam => (localTracks[1].muted))
        })

        document.getElementById('btn-audio').addEventListener('click', e => {
            changeAudio()
            setAudio(aud => (localTracks[0].muted))
        })

         
    }

    // Handlers
    const handleUserPublished = async (userMedia, mediaType) => {
        
        // Store the user information
        setremoteUsers({...remoteUsers, [userMedia.uid]: user})

        // Accept user to the peer chat
        await client.subscribe(userMedia, mediaType)

        
        
        
        // New user joined
        if (!Users.find(user => user.id === userMedia.uid)) {
            // Call getUserByUID
            const newUser = await userService.getUserByUID({
                ...user,
                uid: userMedia.uid
            })
            newUser.isAudioMuted = !userMedia.hasAudio
            newUser.isCameraMuted = !userMedia.hasVideo
            setUsers(u => ([...u, newUser]))
        }
        

        // Create video container for the new user
        addNewVideo(userMedia.uid)

        // live stream to other need to fix
        if (mediaType === 'video') {
            userMedia.videoTrack.play(`user-${userMedia.uid}`)
        }


        // if share screen
        if (mediaType === 'video' && isShareScreen) {
            userMedia.videoTrack.play(isShareScreen)
        }

        if (mediaType === 'audio') {
            userMedia.audioTrack.play()
        }
    }

    let handleUserLeft = async (user) => {
        // Delete the user for the participants variable
        let users = remoteUsers
        delete users[user.uid]
        setremoteUsers(users)

        setUsers(Users => (Users.filter(u => u.id !== user.uid)))

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

    const closeShareScreenDom = useCallback(() => {
        let spotlight = document.getElementById('spotlight')
        spotlight.innerHTML = ''
        spotlight.style.height = '0px !important'
        let userVideo = document.getElementById(userSpot)
        
        if (!userVideo && `user-container-${uid}` !== userSpot) {
            //alert("WALANG LAMAN: " + userSpot)'
            let recentSharer = userSpot.split('-')
            recentSharer = recentSharer[recentSharer.length-1]
            addNewVideo(recentSharer)
            
        }  else {
            spotlight.insertAdjacentElement('beforeend', userVideo)
        }
        
        isShareScreen = null
    }, [userSpot])

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


        spotlight.innerHTML = `
            <div key="${memberID}" id="user-container-${memberID}" class='text-center user-video' >
                <div class='video-container aspect-square w-50 bg-purple-300 border-2 border-purple-700 rounded-full' id="user-sharescreen-${memberID}" >
                </div>
            </div>
        `

            
        userSpot = 'user-container-' + memberID
        isShareScreen = `user-sharescreen-${memberID}`
        

    }
    
    const rtmHandleMessageFromPeer = async (message, MemberID) => {
        message = JSON.parse(message.text)
        
        console.warn("MAY NAG MESSAGE ", message)
        if (message.type === 'spotlight') {
            openSpotlightDom(message.videoId)
        }

        if (message.type === 'close-spotlight') {
            closeSpotLightDom()
        }


        if (message.type === 'sharescreen') {
            setShareScreen(`user-sharescreen-${message.uid}`)
            isShareScreen = `user-sharescreen-${message.uid}`

            userSpot = `user-container-${message.uid}`
            setSpot(`user-container-${message.uid}`)

            setShareScreenDom(message.uid)
        }

        if (message.type === 'close-sharescreen') { //userVideo
            setShareScreen(null)
            isShareScreen = null

            userSpot = message.userSpot
            setSpot(message.userSpot)

            closeShareScreenDom()
            
        }

        if (message.type === 'user-camera') {
            const users = modifyCamera(message)
            setUsers(u => ([...users]))
        }

        if (message.type === 'user-audio') {
            const users = modifyAudio(message)
            setUsers(u => ([...users]))
        }
    }

    const modifyCamera = useCallback((message) => {
        const { username, camera } = message
        console.warn(`${username} if muted ${camera}`)
        
        let users = [...Users]
        users.forEach(user => {
            if (user.username == username) {
                user.isCameraMuted = camera
            }
        })

        return users
    }, [Users])


    // NAG EEMPTY ANG USERS
    const modifyAudio = useCallback((message) => {
        const { username, audio } = message
        console.warn(`${username} if muted ${audio}`)
        let users = [...Users]
        alert(users.length)
        users.forEach(user => {
            if (user.username == username) {
                user.isAudioMuted = audio
            }
        })

        return users
    }, [Users])

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
            setSpot(null)
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

        setSpot(`user-container-${uid}`)

        openSpotlightDom(userVideoId)
    }, [userSpot])


    const changeAudio = async (e) => {
        const audio = !localTracks[0].muted
        await localTracks[0].setMuted(audio)

        // Change my state in my own
        let users = [...Users]
        users.forEach(user => {
            if (user.username == username) {
                user.isAudioMuted = audio
            }
        })
        
        setUsers(u => (users))

        // Send what I update
        channel.sendMessage({
            text: JSON.stringify({
                type:'user-audio', username: user.username, audio
            })
        })
    }

    const changeCamera = async (e) => {
        const camera = !localTracks[1].muted
        await localTracks[1].setMuted(camera)

        // Change my state in my own
        let users = [...Users]
        users.forEach(user => {
            if (user.username == username) {
                user.isCameraMuted = camera
            }
        })
        setUsers(u => (users))

        // Send what I update
        channel.sendMessage({
            text: JSON.stringify({
                type:'user-camera', username: user.username, camera
            })
        })
    }

    let toggleScreen = async (e) => {
        
        // Start to insert Screen sharing video element
        if(userSpot && userSpot !== `user-container-${uid}`) {
            return alert("Someone presenting spotlight")
        }

        if (isShareScreen === `user-sharescreen-${uid}`) {
            //alert("mag cloclose")
            // Close sharescreen
            closeShareScreenDom()

           
            setShareScreen(null)
            isShareScreen = null

            userSpot = `user-container-${uid}`
            setSpot(`user-container-${uid}`)

            alert(userSpot)

            
            channel.sendMessage({
                text: JSON.stringify({
                    type: 'close-sharescreen',
                    userSpot: userSpot,
                })
            })

            // Kill sharescreen
            await client.unpublish([localScreenTracks])

            // Reinitiate my camera and play to all users
            addNewVideo(uid)
            await localTracks[1].play(`user-${uid}`)

            // Publish my local tracks to trigger the user-published
            await client.publish([localTracks[0], localTracks[1]])

            //alert("na closed")
            return 
        }

        if (!isShareScreen) {
            //alert("mag shshare")
            setShareScreenDom(uid)
            
            await client.unpublish();
            
            localScreenTracks = await AgoraRTC.createScreenVideoTrack()
            localScreenTracks.play(isShareScreen)
            
            // Share screen and video
            await client.publish([localScreenTracks])

            setShareScreen(`user-sharescreen-${uid}`)
            isShareScreen = `user-sharescreen-${uid}`

            userSpot = `user-container-${uid}`
            setSpot(`user-container-${uid}`)

            channel.sendMessage({text: JSON.stringify({
                type:'sharescreen', uid: uid, 
            })})


            // Reinitiate my camera and play to all users
            addNewVideo(uid)
            await localTracks[1].play(`user-${uid}`)

            // Publish my local tracks to trigger the user-published
            await client.publish([localTracks[0], localTracks[1]])


            return 
        }
    }




    const switchToCamera = async (member) => {
        console.warn('SWITCH TO CAM: ', member)

        setCamera(false)
        changeCamera()
        let userVideoContainer = document.getElementById(member)
        let spotlight = document.getElementById('spotlight')
        spotlight.style.height = '50vh !important'
        
        spotlight.appendChild(userVideoContainer)
        
        await client.publish([localTracks[0], localTracks[1]])

        
    }

    const loadVideoEvents = useCallback(() => {      
        let videos = document.getElementsByClassName('user-video')  
        for(let i = 0; videos.length > i; i++) {
            videos[i].onclick = setSpotlight
        }
    }, [remoteUsers])


    // Loaders 
    useEffect(() => {console.warn(userService)
        async function loads() {
            let result = await userService.getUserByUsername(user)
            console.warn(result)

            await init()

            result.isAudioMuted = audioMuted
            result.isCameraMuted = cameraMuted

            // Insert my data
            setUsers(e => ([result]))
            setMydata(e => (result))

            
            // Send my data to all
            channel.sendMessage({ 
                text: JSON.stringify({
                    type: 'user-join', userData: result
                })
            })
            
        }

        loads()
        
    }, []) 

    useEffect(() => {
        Users.forEach(u => {
            let nameDom = document.getElementById(`fullname-${u.id}`)
            if  (nameDom) {
                nameDom.innerText = uid === u.id ? 'You' : u.username
            }

            try {
                // Change the dom the user 
                if (u.isAudioMuted) {
                    // is muted
                    document.getElementById(`user-${uid}`).classList.add('audioOn')
                } else {
                    document.getElementById(`user-${uid}`).classList.remove('audioOn')
                }
            } catch (err) {

            }
        })

        console.warn(`USERS`, Users)
    }, [Users])


    useEffect(() => {
        loadVideoEvents()
    }, [allowControl])



    // Dynamic video element
    const addNewVideo = useCallback(async (member) => {
        
        let newUser = Users.find(s => s.id === member)
        let video = document.getElementById(`user-container-${member}`)
        let videos = document.getElementById('videos')
        if (video == null) {
            videos.insertAdjacentHTML('beforeend', `
                <div key="${member}" id="user-container-${member}" class='text-center user-video' >
                    <div class='video-container aspect-square w-50 bg-purple-300 border-2  rounded-full' id="user-${member}" >
                    </div>
                    <small id="fullname-${member}" class='text-sm text-purple-500'>${member}</small>
                </div>
            `)
        }
    }, [Users])

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

    let cameraToggle = () => {
        if (!cameraMuted) {
            return (
                <button id='btn-cam' className={` shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3`}>
                    <FaCamera/>
                </button>
            )
        } else {
            return (
                <button id='btn-cam' className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaCamera/>
                </button>
            )
        }
    }


    let audioToggle = useCallback(() => {
        if (audioMuted) {
            return (
                <button id='btn-audio' className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaMicrophone/>
                </button>
            )
        }

        return (
            <button id='btn-audio' className={` shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3`}>
                <FaMicrophone/>
            </button>
        )
    }, [audioMuted])
    
   if(user) {
        return (
            <div className=' font-mono h-full'>

                <div className='border-b-2  bg-purple-100 border-purple-600 mb-5' id="spotlight">
                    
                </div>

                <div className='flex gap-2 justify-center' id='videos'>
                </div>

                <p className='text-center p-3 text-lg'>
                    {Users.length}
                </p>
                
                <div className='fixed bottom-3 inset-x-1/2 mx-auto  flex gap-2 justify-center'>
                    { audioToggle() }

                    { cameraToggle() }

                    { spotlightToggle() }

                    { allowAllSpotlightControl }

                    { shareScreenToggle }
                </div>

                
            </div>
        )
    } else {
        window.location.href = '/'
    }
} 

export default React.memo(Room)