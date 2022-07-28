import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {FaMicrophone, FaCamera, FaMicrophoneAltSlash} from 'react-icons/fa'
//Agora SDK for our Realtime Connection
import '../../../assets/agora-rtm-sdk-1.4.5'



function Room() {

    const userState = useSelector(state => state.user)
    const {
        user
    } = userState

    

    // My devices
    const [camera, setCamera] = useState(true)
    const [audio, setAudio] = useState(false)

    // FOR AGO VARS
    const AGORA_APP_ID = "4b3a1d46ac90441c840669b7f31417bb"
    const token = null 
    const [uid, setUid] = useState(user.username) // My uniqie ID for Peering, later it will be the USER LOGGED ID
    let client
    let channel // Room that will users can join
    const [roomMembers, setMembers] = useState([user.username])
    
    // FOR WEB RTC VARS
    let [localStream, setlocalStream] = useState(null) // my camera and audio
    let remoteStream // once connected to other user we can remote their media data
    let peerConnection // will stored all information to all connected users

    // Servers that we will used to handle our peer connections, so we dont need to create our own
    const STUNservers = {
        iceServers: [
            {
                urls: [
                    'stun:stun1.l.google.com:19302', 
                    'stun:stun2.l.google.com:19302'
                ]
            }
        ]
    }
    
    let devicePermission = async () => {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: audio,
            video: camera
        })

        console.warn(localStream)

        // Initiate my Media to my page
        addNewVideo(roomMembers[0])
        document.getElementById(roomMembers[0]).srcObject = localStream
        
    }

    console.log("TANGINA MO REACT")

    let init = useCallback(async () => {
        // -------- STEP 1 ---------
        //Get current room
        const params = new URLSearchParams(window.location.search)
        const roomID = params.get("id")

        // loopVideos()
        
        //Get recent room
        // let recentRoom = localStorage.getItem('recentRoom')
        // if  (recentRoom != roomID) {
        //     localStorage.setItem('roomMembers', JSON.stringify([]))
        // }

        // localStorage.setItem('recentRoom', roomID)

        
        //Request permission to my devices
        await devicePermission()

        //Initiate myself to Agora to create client object
        client = await AgoraRTM.createInstance(AGORA_APP_ID)
        await client.login({
            uid, token
        })

        // Room with uniqe room ID
        channel = client.createChannel(roomID)
        await channel.join()

        // Get cached member 
        // try {
        //     let members = JSON.parse(localStorage.getItem('roomMembers'))
        //     if (members.length == 0) {
        //         setMembers([user.username, ...await channel.getMembers()])
        //     } else {
        //         setMembers([...members])
        //     }
        // } catch (err) {
        //     setMembers([user.username])
        //     localStorage.setItem('roomMembers', JSON.stringify(roomMembers))
        // }

        let members = await channel.getMembers()
        console.warn("INITIAL MEMBERS: ", members)

        
        
        //Listen to users joined
        channel.on('MemberJoined', handleUserJoined)

        // Listen for the user left
        channel.on('MemberLeft', handleUserLeft)

        // Listen to all messages from the room
        client.on('MessageFromPeer', handleMessageFromPeer)
    }, [])

    let handleUserJoined = async (MemberID) => {
        console.log("New user joined to AGORA room: ", MemberID)
        console.warn("PUMASOK: ", MemberID)

        // updateUserlist
        // updateMembers(MemberID)
        
        // push new member
        setMembers(await channel.getMembers())
        
        //Pass new Joined Member ID
        createOffer(MemberID)
    }

    let handleMessageFromPeer = useCallback(async (message, senderID) => {
        message = JSON.parse(message.text) // New message from new member of the room
        console.warn(`${message.type} Message : `, message)

        // TEST
        if(message.type === 'offer') {
            // -------- STEP 3 ---------
            await createAnswer(senderID, message.offer)
        }

        // Will Listen by whose offer 
        if(message.type === 'answer') {
            // -------- STEP 4 ---------
            sendMyFinalAnswer(message.answer)
        }

        // Will Listen by all, then Setup the final peer
        if(message.type === 'candidate') {
            // -------- STEP 5 ---------
            if (peerConnection) {
                //Then now add to the candidate category means stablished users
                peerConnection.addIceCandidate(message.candidate)
                console.warn("FINAL MEMBERS: ", roomMembers)
            }
        }
    }, [])

    let handleUserLeft = useCallback(async (MemberId) => {
        console.warn("UMALIS: ", MemberId)
        document.getElementById(MemberId + '-root').style.display = 'none'
        setMembers(roomMembers.filter(member => member != MemberId))
        
        //localStorage.setItem('roomMembers', JSON.stringify(roomMembers))
    }, [])

    let updateMembers = async () => {
        let members = await channel.getMembers()
        console.warn(members)
        setMembers(members)
        // loopVideos()
    }

    let createPeerConnection = useCallback(async (MemberID) => {
        // updateMembers()
        addNewVideo(MemberID)
        // To make sure localStream is activated before to connect to RTCPeer
        if(!localStream) {
            //Request permission to my devices
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })
        }

        //I Start to connect as new Candidate in RTC
        peerConnection = new RTCPeerConnection(STUNservers)

        
        //Get other user Media connected
        
        remoteStream = new MediaStream()
        console.error(MemberID)
        document.getElementById(MemberID).srcObject = remoteStream

        //Get my localTracks or Media datas and loop to send it to RTCPeerConnection
        localStream.getTracks().forEach(track => {
            //Push to RTCPeerConnection to received by others
            peerConnection.addTrack(track, localStream)
        })


        // Listen to all connected by getting their tracks or media data
        peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track)
            })
        }

        // When someone or me connected I get it from on the STUN servers
        peerConnection.onicecandidate = async event => {
            if (event.candidate) {
                // console.log("New ICE Candidate: ", event.candidate)
                //Send my OFFER to all connected users into the room as new CANDIDATE - Agora
                const newCandidate = JSON.stringify({
                    type: 'candidate', candidate: event.candidate,
                })
                client.sendMessageToPeer({
                    text: newCandidate
                }, MemberID) // MemberID the sender
            }
        }
        
    }, [])

    //RTC Flow | 
    // 1. Enable my LocalStream, to run MediaDevice to RTCPeer
    // 2. Create my offer
    // 3. Send my offer to users connected to RTCPeer
    // 4. Recieved the answer from the users that I send my offer
    // 5. Then Send my final answer too to the users that accept my offer to be Candidate in the RTCPeer.


    // Create offer for other connected users
    let createOffer = useCallback(async (MemberID) => {
        // -------- STEP 2 ---------
        await createPeerConnection(MemberID)

        // Create my actual offer 
        let offer = await peerConnection.createOffer() 
      
        // This my offer and now Each connection will now have offer and answer
        // then it will trigger the onicecandidate above
        await peerConnection.setLocalDescription(offer) // Each user need own setLocalDescription
        console.log('Offer: ', offer)
        
        //Send my OFFER to all connected users into the room as new Member - Agora
        const newMemberOffer = JSON.stringify({
            type: 'offer', offer,
        })
        client.sendMessageToPeer({
            text: newMemberOffer
        }, MemberID) // MemberID the sender
    }, [])

    // Creating My Answer for someone offer
    let createAnswer = useCallback(async (MemberID, offer) => {
        // -------- STEP 3 ---------
        // Create peer connection for someone OFFER to watch them in my page
        await createPeerConnection(MemberID)

        // Then set the offer Media data from RPCConnection server to run in my web page
        await peerConnection.setRemoteDescription(offer) // Like accepting an offer

        // then GET my own ANSWER 
        let answer = await peerConnection.createAnswer()
        
        // then submit my answer to fully stablish the PeerConnection between me and those offer
        await peerConnection.setLocalDescription(answer)
        
        //Send my ANSWER to all connected users into the room 
        const myAnswerForTheOffer = JSON.stringify({
            type: 'answer', answer,
        })
        client.sendMessageToPeer({
            text: myAnswerForTheOffer
        }, MemberID) // MemberID the sender
    }, [])

    // -------- STEP 4 ---------
    let sendMyFinalAnswer = useCallback(async (someoneAnswer) => {
        // If I didnt Peered or connected to the users as candidate 
        if (!peerConnection.currentRemoteDescription) {
            // Run their media to my web page
            await peerConnection.setRemoteDescription(someoneAnswer) 
        }
    }, [])

    // If I leave
    const leaveChannel = useCallback(async () => {
        await channel.leave()
        await client.logout()
    }, [])

    useEffect(() => {
        console.log("INIT")
        init()
    }, []) 

    
    window.addEventListener('boforeunload', leaveChannel)

    const changeAudio = useCallback(async (e) => {
        localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled
        updateAudio(localStream.getAudioTracks()[0].enabled)
    }, [localStream])

    const changeCamera = useCallback(async (e) => {
        let videoTrack = localStream.getTracks().find(track => track.kind === 'video')
        console.log(videoTrack)
        videoTrack.enabled = !videoTrack.enabled
        updateCamera(videoTrack.enabled)
    }, [localStream])

    const updateCamera = useCallback((state) => {
        setCamera(state)
    }, [camera])

    const updateAudio = useCallback((state) => {
        setAudio(state)
    }, [audio])
    

    const audioState = useMemo(() => {
        return audio ? <FaMicrophoneAltSlash/> : <FaMicrophone/>
    }, [audio])


    // Dynamic video element

    const participantsVideo = useMemo(() => {
        return roomMembers.map(member => {
            return (
                <div key={member} className='border rounded w-1/3 h-50 text-center'>
                    <video  className='w-full h-full bg-purple-300' id={member} autoPlay playsInline>
                    </video>
                    <small className='text-sm text-purple-500'>{member}</small>
                </div>
            )
        })
    },[roomMembers])


    const loopVideos = async () => {
        let videos = document.getElementById('videos')
        videos.innerHTML = ''
        roomMembers.forEach(member => {
            videos.insertAdjacentHTML('beforeend', `
                <div key="${member}" id="${member}-root" class='border rounded w-1/3 h-50 text-center'>
                    <video  class='w-full h-full bg-purple-300' id="${member}" autoPlay playsInline>
                    </video>
                    <small class='text-sm text-purple-500'>${member}</small>
                </div>
            `)
        })
    }

    const addNewVideo = useCallback(async (member) => {
        let video = document.getElementById(member)
        if(!roomMembers.find(member => member === member) || !video) {
            let videos = document.getElementById('videos')
            videos.insertAdjacentHTML('beforeend', `
                <div key="${member}" class='border rounded w-1/3 h-50 text-center'>
                    <video  class='w-full h-full bg-purple-300' id="${member}" autoPlay playsInline>
                    </video>
                    <small class='text-sm text-purple-500'>${member}</small>
                </div>
            `)
        }
        
    },[])

    
   if(user) {
        return (
            <div className='container mx-auto px-4 font-mono'>
                <div className='flex gap-2 justify-center' id='videos'>
                    {/* <video className='rounded w-1/3 h-50 bg-purple-300' id='user-1' autoPlay playsInline></video>
                    <video className='rounded w-1/3 h-50 bg-purple-300 hidden' id='user-2' autoPlay playsInline></video> */}
                    
                </div>

                <div className='fixed bottom-3 inset-x-1/2 mx-auto  flex gap-2 justify-center'>
                    <button onClick={changeAudio} className='bg-purple-500 rounded p-3 text-purple-100 '>
                        {
                            audioState
                        }
                    </button>

                    <button onClick={changeCamera} className={`${camera ? 'bg-red-500' : 'bg-purple-500'} rounded p-3 text-purple-100 `}>
                        <FaCamera/>
                    </button>
                </div>
            </div>
        )
    } else {
        window.location.href = '/'
    }
} 

export default React.memo(Room)