import React, { useCallback, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

//Agora SDK for our Realtime Connection
import '../../../assets/agora-rtm-sdk-1.4.5'


function Room() {

    const userState = useSelector(state => state.user)
    const {
        user
    } = userState

    const navigate = useNavigate()

    // FOR AGO VARS
    const AGORA_APP_ID = "4b3a1d46ac90441c840669b7f31417bb"
    let token = null 
    let [uid, setUid] = useState(String(Math.floor(Math.random() * 10000))) // My uniqie ID for Peering, later it will be the USER LOGGED ID
    let client
    let channel // Room that will users can join


    // FOR WEB RTC VARS
    let localStream // my camera and audio
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

    let init = async () => {
        // -------- STEP 1 ---------
        //Request permission to my devices
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        })

        // Initiate my Media to my page
        document.getElementById('user-1').srcObject = localStream

        //Initiate myself to Agora to create client object
        client = await AgoraRTM.createInstance(AGORA_APP_ID)
        await client.login({
            uid, token
        })

        // Room with uniqe room ID
        channel = client.createChannel('main_room')
        await channel.join()

        //Listen to users joined
        channel.on('MemberJoined', handleUserJoined)

        // Listen to all messages from the room
        client.on('MessageFromPeer', handleMessageFromPeer)

        // Listen for the user left
        channel.on('MemberLeft', handleUserLeft)
        
    }

    let handleUserJoined = async (MemberID) => {
        console.log("New user joined to AGORA room: ", MemberID)
        
        //Pass new Joined Member ID
        createOffer(MemberID)
    }

    let handleMessageFromPeer = async (message, senderID) => {
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
            }
        }
    }

    let handleUserLeft = async (MemberId) => {
        document.getElementById('user-2').style.display = "none"
    }

    
    let createPeerConnection = async (MemberID) => {
        // To make sure localStream is activated before to connect to RTCPeer
        if(!localStream) {
            //Request permission to my devices
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true
            })
        }

        //I Start to connect as new Candidate in RTC
        peerConnection = new RTCPeerConnection(STUNservers)
        
        //Get other user Media connected
        remoteStream = new MediaStream()
        document.getElementById('user-2').srcObject = remoteStream
        document.getElementById('user-2').style.display = 'block'
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
    }

    //RTC Flow | 
    // 1. Enable my LocalStream, to run MediaDevice to RTCPeer
    // 2. Create my offer
    // 3. Send my offer to users connected to RTCPeer
    // 4. Recieved the answer from the users that I send my offer
    // 5. Then Send my final answer too to the users that accept my offer to be Candidate in the RTCPeer.


    // Create offer for other connected users
    let createOffer = async (MemberID) => {
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
    }

    // Creating My Answer for someone offer
    let createAnswer = async (MemberID, offer) => {
        // -------- STEP 3 ---------
        //Create peer connection for someone OFFER to watch them in my page
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
    }

    // -------- STEP 4 ---------
    let sendMyFinalAnswer = async (someoneAnswer) => {
        // If I didnt Peered or connected to the users as candidate 
        if (!peerConnection.currentRemoteDescription) {
            // Run their media to my web page
            await peerConnection.setRemoteDescription(someoneAnswer) 
        }
    }

    // If I leave
    let leaveChannel = async () => {
        await channel.leave()
        await client.logout()
    }

    window.addEventListener('boforeunload', leaveChannel)
  

    init()


    if(user) {
        return (
            <div className='container mx-auto px-4 font-mono'>
                <div className='flex gap-2 justify-center'>
                    <video className='rounded w-1/3 h-50 bg-purple-300' id='user-1' autoPlay playsInline></video>
                    <video className='rounded w-1/3 h-50 bg-purple-300 hidden' id='user-2' autoPlay playsInline></video>
                </div>
            </div>
        )
    } else {
        useEffect(() => {
            navigate('/')
        }, [user])
    }
}

export default React.memo(Room)