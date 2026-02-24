import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import './VoiceChat.css';

const VoiceChat = ({ socket, workspaceId, userId, username }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isSelfMonitoring, setIsSelfMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioContextRef = useRef(null);
  const localAudioRef = useRef(null);

  const createPeerConnection = (targetUserId) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peer = new RTCPeerConnection(config);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
        console.log('[VoiceChat] Added track to peer connection:', track.kind);
      });
    }

    // Handle incoming audio stream
    peer.ontrack = (event) => {
      console.log('[VoiceChat] Received remote track from:', targetUserId);
      const remoteStream = event.streams[0];
      playRemoteAudio(remoteStream, targetUserId);
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[VoiceChat] Sending ICE candidate to:', targetUserId);
        socket.emit('voice_ice_candidate', {
          to: targetUserId,
          candidate: event.candidate
        });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log('[VoiceChat] Connection state with', targetUserId, ':', peer.connectionState);
      setConnectionStatus(prev => ({ ...prev, [targetUserId]: peer.connectionState }));
      
      if (peer.connectionState === 'connected') {
        toast.success(`Connected to peer`);
      } else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        toast.error(`Connection lost with user`);
      }
    };

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  const playRemoteAudio = (stream, userId) => {
    console.log('[VoiceChat] Playing remote audio from:', userId);
    // Remove existing audio element if any
    const existingAudio = document.getElementById(`audio-${userId}`);
    if (existingAudio) {
      existingAudio.remove();
    }

    // Create new audio element
    const audio = document.createElement('audio');
    audio.id = `audio-${userId}`;
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.volume = 1.0;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    
    audio.play().then(() => {
      console.log('[VoiceChat] Successfully playing audio from:', userId);
    }).catch(err => {
      console.error('[VoiceChat] Error playing audio:', err);
      toast.error('Failed to play remote audio');
    });
  };

  const handleOffer = async (fromUserId, offer) => {
    try {
      console.log('[VoiceChat] Handling offer from:', fromUserId);
      const peer = createPeerConnection(fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      console.log('[VoiceChat] Sending answer to:', fromUserId);
      socket.emit('voice_answer', {
        to: fromUserId,
        answer: answer
      });
    } catch (err) {
      console.error('[VoiceChat] Error handling offer:', err);
      toast.error('Failed to connect to peer');
    }
  };

  const handleAnswer = async (fromUserId, answer) => {
    try {
      console.log('[VoiceChat] Handling answer from:', fromUserId);
      const peer = peersRef.current[fromUserId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[VoiceChat] Set remote description for:', fromUserId);
      } else {
        console.warn('[VoiceChat] No peer connection found for:', fromUserId);
      }
    } catch (err) {
      console.error('[VoiceChat] Error handling answer:', err);
    }
  };

  const handleIceCandidate = async (fromUserId, candidate) => {
    try {
      console.log('[VoiceChat] Handling ICE candidate from:', fromUserId);
      const peer = peersRef.current[fromUserId];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[VoiceChat] Added ICE candidate for:', fromUserId);
      } else {
        console.warn('[VoiceChat] No peer connection found for ICE candidate from:', fromUserId);
      }
    } catch (err) {
      console.error('[VoiceChat] Error handling ICE candidate:', err);
    }
  };

  useEffect(() => {
    // Check if browser supports required APIs
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(supported);

    if (!supported) {
      console.warn('Voice chat not supported in this browser');
      return;
    }

    if (!socket) return;

    // Listen for voice chat events
    const handleUserJoined = async ({ userId: joinedUserId, username: joinedUsername }) => {
      console.log('[VoiceChat] User joined:', joinedUsername, joinedUserId);
      setParticipants(prev => {
        if (prev.find(p => p.userId === joinedUserId)) return prev;
        return [...prev, { userId: joinedUserId, username: joinedUsername }];
      });

      // If we're already in the call, create a peer connection and send an offer
      if (localStreamRef.current && joinedUserId !== userId) {
        console.log('[VoiceChat] Creating offer for new participant:', joinedUserId);
        try {
          const peer = createPeerConnection(joinedUserId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          
          console.log('[VoiceChat] Sending offer to:', joinedUserId);
          socket.emit('voice_offer', {
            to: joinedUserId,
            offer: offer
          });
        } catch (err) {
          console.error('[VoiceChat] Error creating offer for new participant:', err);
        }
      }
    };

    const handleUserLeft = ({ userId: leftUserId }) => {
      console.log('[VoiceChat] User left:', leftUserId);
      setParticipants(prev => prev.filter(p => p.userId !== leftUserId));
      
      // Clean up peer connection
      if (peersRef.current[leftUserId]) {
        peersRef.current[leftUserId].close();
        delete peersRef.current[leftUserId];
      }
      
      // Remove audio element
      const audio = document.getElementById(`audio-${leftUserId}`);
      if (audio) audio.remove();
    };

    const handleVoiceOffer = async ({ from, offer }) => {
      console.log('[VoiceChat] Received offer from:', from, 'my userId:', userId);
      if (from !== userId) {
        await handleOffer(from, offer);
      }
    };

    const handleVoiceAnswer = async ({ from, answer }) => {
      console.log('[VoiceChat] Received answer from:', from, 'my userId:', userId);
      if (from !== userId) {
        await handleAnswer(from, answer);
      }
    };

    const handleVoiceIceCandidate = async ({ from, candidate }) => {
      console.log('[VoiceChat] Received ICE candidate from:', from, 'my userId:', userId);
      if (from !== userId) {
        await handleIceCandidate(from, candidate);
      }
    };

    socket.on('voice_user_joined', handleUserJoined);
    socket.on('voice_user_left', handleUserLeft);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('voice_ice_candidate', handleVoiceIceCandidate);

    return () => {
      socket.off('voice_user_joined', handleUserJoined);
      socket.off('voice_user_left', handleUserLeft);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('voice_ice_candidate', handleVoiceIceCandidate);
    };
  }, [socket, userId]);

  const startVoiceChat = async () => {
    try {
      console.log('[VoiceChat] Starting voice chat...');
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('[VoiceChat] Got local stream with', stream.getTracks().length, 'tracks');
      localStreamRef.current = stream;
      setIsInCall(true);
      
      // Notify server
      console.log('[VoiceChat] Emitting voice_join for userId:', userId);
      socket.emit('voice_join', { workspaceId, userId, username });
      toast.success('🎙️ Joined voice chat');

      // Create peer connections for existing participants
      participants.forEach(async (participant) => {
        if (participant.userId !== userId) {
          console.log('[VoiceChat] Creating peer connection for existing participant:', participant.userId);
          const peer = createPeerConnection(participant.userId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          
          console.log('[VoiceChat] Sending offer to existing participant:', participant.userId);
          socket.emit('voice_offer', {
            to: participant.userId,
            offer: offer
          });
        }
      });
    } catch (err) {
      console.error('[VoiceChat] Error starting voice chat:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone access denied');
      } else {
        toast.error('Failed to start voice chat');
      }
    }
  };

  const stopVoiceChat = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop self-monitoring
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.srcObject = null;
      localAudioRef.current = null;
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};

    // Remove all remote audio elements
    participants.forEach(p => {
      const audio = document.getElementById(`audio-${p.userId}`);
      if (audio) audio.remove();
    });

    setIsInCall(false);
    setIsMuted(false);
    setIsSelfMonitoring(false);
    setParticipants([]);

    // Notify server
    socket.emit('voice_leave', { workspaceId, userId });
    toast('Left voice chat', { icon: '👋' });
  };

  const toggleSelfMonitoring = () => {
    if (!localStreamRef.current) return;

    if (isSelfMonitoring) {
      // Stop monitoring
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.srcObject = null;
        localAudioRef.current = null;
      }
      setIsSelfMonitoring(false);
      toast('Self-monitoring off', { icon: '🔇' });
    } else {
      // Start monitoring
      if (!localAudioRef.current) {
        const audio = new Audio();
        audio.srcObject = localStreamRef.current;
        audio.volume = 1.0;
        audio.muted = false;
        localAudioRef.current = audio;
      }
      localAudioRef.current.play();
      setIsSelfMonitoring(true);
      toast('Self-monitoring on - You can hear yourself', { icon: '🎧' });
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast(audioTrack.enabled ? 'Unmuted' : 'Muted', { 
          icon: audioTrack.enabled ? '🎤' : '🔇' 
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        className="voice-chat-btn not-supported"
        disabled
        title="Voice chat not supported in this browser"
      >
        <span className="voice-chat-icon">🎙️</span>
        <span>Not Supported</span>
      </button>
    );
  }

  return (
    <div className="voice-chat-container">
      {!isInCall ? (
        <button
          className="voice-chat-btn join"
          onClick={startVoiceChat}
          title="Join voice chat"
        >
          <span className="voice-chat-icon">🎙️</span>
          <span>Join Voice</span>
        </button>
      ) : (
        <>
          <button
            className={`voice-chat-btn mute ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <span className="voice-chat-icon">{isMuted ? '🔇' : '🎤'}</span>
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>
          <button
            className={`voice-chat-btn monitor ${isSelfMonitoring ? 'active' : ''}`}
            onClick={toggleSelfMonitoring}
            title={isSelfMonitoring ? 'Stop hearing yourself' : 'Hear yourself'}
          >
            <span className="voice-chat-icon">{isSelfMonitoring ? '🎧' : '👂'}</span>
            <span>{isSelfMonitoring ? 'Monitoring' : 'Hear Me'}</span>
          </button>
          <button
            className="voice-chat-btn leave"
            onClick={stopVoiceChat}
            title="Leave voice chat"
          >
            <span className="voice-chat-icon">📞</span>
            <span>Leave</span>
          </button>
          {participants.length > 0 && (
            <div className="voice-chat-status">
              <span className="voice-chat-participants">
                {participants.length} in call
              </span>
              <div className="voice-chat-connection-indicators">
                {Object.entries(connectionStatus).map(([peerId, status]) => (
                  <span 
                    key={peerId}
                    className={`voice-chat-connection-dot ${status}`}
                    title={`Connection: ${status}`}
                  >
                    {status === 'connected' ? '🟢' : status === 'connecting' ? '🟡' : '🔴'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VoiceChat;
