import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { FaThumbsUp, FaThumbsDown, FaMicrophone, FaCamera, FaMicrophoneAltSlash, FaRegTimesCircle, FaRegGrinStars} from 'react-icons/fa'
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from 'react-icons/md'
//Agora SDK for our Realtime Connection
import '../../../assets/agora-rtm-sdk-1.4.5'


//Agora for Video Call
import '../../../assets/AgoraRTC_N-4.13.0'
import { setMessage } from '../../../features/user/userSlice'

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

    const userState = useSelector(state => state.user)
    const {
        user,
    } = userState
    
    
    try {
        let s = user.id
    } catch (err) {
        window.location.href = '/'
    }

    // My devices
    const [cameraMuted, setCamera] = useState(false)
    const [audioMuted, setAudio] = useState(true)


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

            console.error(rtmClient)

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
            }
        })

        // Initiate my own Video container
        addNewVideo(uid)
        await localTracks[1].play(`user-${uid}`)


        // Publish my local tracks to trigger the user-published
        await client.publish([localTracks[0], localTracks[1]])

        // Default device state
        await localTracks[1].setMuted(false)
        await localTracks[0].setMuted(true)
        
        // Toggle listener
        document.getElementById('btn-cam').addEventListener('click', e => {
            changeCamera()
            setCamera(localTracks[1].muted)
        })

        document.getElementById('btn-audio').addEventListener('click', e => {
            changeAudio()
            setAudio(localTracks[0].muted)
        })

        // document.getElementById('btn-screen').addEventListener('click', e => {
        //     toggleScreen(e)
        // })
    }

    // Handlers
    const handleUserPublished = async (user, mediaType) => {
        
        // Store the user information
        setremoteUsers({...remoteUsers, [user.uid]: user})

        // Accept user to the peer chat
        await client.subscribe(user, mediaType)

        // Create video container for the new user
        addNewVideo(user.uid)

        // live stream to other need to fix
        if (mediaType === 'video') {
            user.videoTrack.play(`user-${user.uid}`)
        }


        // if share screen
        if (mediaType === 'video' && isShareScreen) {
            user.videoTrack.play(isShareScreen)
           
        }


        if (mediaType === 'audio') {
            user.audioTrack.play()
        }
    }

    let handleUserLeft = async (user) => {
        // Delete the user for the participants variable
        let users = remoteUsers
        delete users[user.uid]
        setremoteUsers(users)

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
            //alert("may na close")

            setShareScreen(null)
            isShareScreen = null

            userSpot = message.userSpot
            setSpot(message.userSpot)

            closeShareScreenDom()

            // document.getElementById(userSpot).remove()
            
        }

        // set control
    }

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
        rtmClient.sendMessageToPeer({
            text: newMessage
        }, rtmUid)

    }, [allowControl, isShareScreen])

    // Close spotlight
    const closeSpotlight = useCallback(() => {
        // ONly me can close my own spotligth
        console.log(userSpot)
        if(userSpot === `user-container-${uid}`) {
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

        if(userSpot && userSpot != `user-container-${uid}`) {
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
        await localTracks[0].setMuted(!localTracks[0].muted)
    }

    const changeCamera = async (e) => {
        await localTracks[1].setMuted(!localTracks[1].muted)
    }

    let toggleScreen = async (e) => {
        
        // Start to insert Screen sharing video element
        if(userSpot && userSpot !== `user-container-${uid}`) {
            return alert("MAG PAALAM KA MUNA")
        }

        if (isShareScreen === `user-sharescreen-${uid}`) {
            //alert("mag cloclose")
            // Close sharescreen
            closeShareScreenDom()

           
            setShareScreen(null)
            isShareScreen = null

            userSpot = `user-container-${uid}`
            setSpot(`user-container-${uid}`)

            
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
    useEffect(() => {
        init()
    }, []) 

    useEffect(() => {
        loadVideoEvents()
    }, [allowControl])



    // Dynamic video element
    const addNewVideo = async (member) => {
        let video = document.getElementById(`user-container-${member}`)
        let videos = document.getElementById('videos')
        if (video == null) {
            videos.insertAdjacentHTML('beforeend', `
                <div key="${member}" id="user-container-${member}" class='text-center user-video' >
                    <div class='video-container aspect-square w-50 bg-purple-300 border-2 border-purple-700 rounded-full' id="user-${member}" >
                    </div>
                    <small class='text-sm text-purple-500'>${member == uid ? 'You' : member}</small>
                </div>
            `)
        }
    }

    let spotlightToggle = useMemo(() => {

        if (isShareScreen) {
            return (
                <button onClick={setMeSpot} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <FaRegGrinStars />
                </button>
            )
        }
        
        if(!userSpot) {
            return (
                <button onClick={setMeSpot} className=' shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3'>
                    <FaRegGrinStars />
                </button>
            )
        }

        if (userSpot !== `user-container-${uid}`) {
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
       
    }, [userSpot])


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
    }, [cameraMuted])


    let audioToggle = useMemo(() => {
        if (!audioMuted) {
            return (
                <button id='btn-audio' className={` shadow-purple-400 rounded text-purple-700 border-purple-700 border-2 p-3`}>
                    <FaMicrophone/>
                </button>
            )
        } else {
            return (
                <button id='btn-audio' className=' shadow-purple-400 rounded text-white  bg-purple-700 p-3'>
                    <FaMicrophone/>
                </button>
            )
        }
    }, [audioMuted])
    
   if(user) {
        return (
            <div className=' font-mono h-full'>

                <div className='border-b-2  bg-purple-100 border-purple-600 mb-5' id="spotlight">
                    
                </div>

                <div className='flex gap-2 justify-center' id='videos'>
                </div>
                

                <div className='fixed bottom-3 inset-x-1/2 mx-auto  flex gap-2 justify-center'>
                    { audioToggle }

                    { cameraToggle }

                    { spotlightToggle }

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