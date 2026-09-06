import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Mic, MicOff, Headphones, Ear, PhoneOff, Circle } from "lucide-react";
import "./VoiceChat.css";

const VoiceChat = ({ socket, workspaceId, userId, username }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isSelfMonitoring, setIsSelfMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const localAudioRef = useRef(null);

  const createPeerConnection = (targetUserId) => {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const peer = new RTCPeerConnection(config);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      playRemoteAudio(remoteStream, targetUserId);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice_ice_candidate", {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        [targetUserId]: peer.connectionState,
      }));

      if (peer.connectionState === "connected") {
        toast.success("Connected to peer");
      } else if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected"
      ) {
        toast.error("Connection lost with user");
      }
    };

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  const playRemoteAudio = (stream, userId) => {
    const existingAudio = document.getElementById(`audio-${userId}`);
    if (existingAudio) existingAudio.remove();

    const audio = document.createElement("audio");
    audio.id = `audio-${userId}`;
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.volume = 1.0;
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.play().catch((err) => {
      console.error("[VoiceChat] Error playing audio:", err);
      toast.error("Failed to play remote audio");
    });
  };

  const handleOffer = async (fromUserId, offer) => {
    try {
      const peer = createPeerConnection(fromUserId);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("voice_answer", { to: fromUserId, answer });
    } catch (err) {
      console.error("[VoiceChat] Error handling offer:", err);
      toast.error("Failed to connect to peer");
    }
  };

  const handleAnswer = async (fromUserId, answer) => {
    try {
      const peer = peersRef.current[fromUserId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error("[VoiceChat] Error handling answer:", err);
    }
  };

  const handleIceCandidate = async (fromUserId, candidate) => {
    try {
      const peer = peersRef.current[fromUserId];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("[VoiceChat] Error handling ICE candidate:", err);
    }
  };

  useEffect(() => {
    const supported = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    setIsSupported(supported);

    if (!supported || !socket) return;

    const handleUserJoined = async ({
      userId: joinedUserId,
      username: joinedUsername,
    }) => {
      setParticipants((prev) => {
        if (prev.find((p) => p.userId === joinedUserId)) return prev;
        return [...prev, { userId: joinedUserId, username: joinedUsername }];
      });

      if (localStreamRef.current && joinedUserId !== userId) {
        try {
          const peer = createPeerConnection(joinedUserId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("voice_offer", { to: joinedUserId, offer });
        } catch (err) {
          console.error("[VoiceChat] Error creating offer:", err);
        }
      }
    };

    const handleUserLeft = ({ userId: leftUserId }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== leftUserId));
      if (peersRef.current[leftUserId]) {
        peersRef.current[leftUserId].close();
        delete peersRef.current[leftUserId];
      }
      const audio = document.getElementById(`audio-${leftUserId}`);
      if (audio) audio.remove();
    };

    const handleVoiceOffer = async ({ from, offer }) => {
      if (from !== userId) await handleOffer(from, offer);
    };

    const handleVoiceAnswer = async ({ from, answer }) => {
      if (from !== userId) await handleAnswer(from, answer);
    };

    const handleVoiceIceCandidate = async ({ from, candidate }) => {
      if (from !== userId) await handleIceCandidate(from, candidate);
    };

    socket.on("voice_user_joined", handleUserJoined);
    socket.on("voice_user_left", handleUserLeft);
    socket.on("voice_offer", handleVoiceOffer);
    socket.on("voice_answer", handleVoiceAnswer);
    socket.on("voice_ice_candidate", handleVoiceIceCandidate);

    return () => {
      socket.off("voice_user_joined", handleUserJoined);
      socket.off("voice_user_left", handleUserLeft);
      socket.off("voice_offer", handleVoiceOffer);
      socket.off("voice_answer", handleVoiceAnswer);
      socket.off("voice_ice_candidate", handleVoiceIceCandidate);
    };
  }, [socket, userId]);

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setIsInCall(true);
      socket.emit("voice_join", { workspaceId, userId, username });
      toast.success("🎙️ Joined voice chat");

      participants.forEach(async (participant) => {
        if (participant.userId !== userId) {
          const peer = createPeerConnection(participant.userId);
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("voice_offer", { to: participant.userId, offer });
        }
      });
    } catch (err) {
      console.error("[VoiceChat] Error starting voice chat:", err);
      if (err.name === "NotAllowedError") {
        toast.error("Microphone access denied");
      } else {
        toast.error("Failed to start voice chat");
      }
    }
  };

  const stopVoiceChat = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.srcObject = null;
      localAudioRef.current = null;
    }

    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};

    participants.forEach((p) => {
      const audio = document.getElementById(`audio-${p.userId}`);
      if (audio) audio.remove();
    });

    setIsInCall(false);
    setIsMuted(false);
    setIsSelfMonitoring(false);
    setParticipants([]);
    socket.emit("voice_leave", { workspaceId, userId });
    toast("Left voice chat", { icon: "👋" });
  };

  const toggleSelfMonitoring = () => {
    if (!localStreamRef.current) return;

    if (isSelfMonitoring) {
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.srcObject = null;
        localAudioRef.current = null;
      }
      setIsSelfMonitoring(false);
      toast("Self-monitoring off", { icon: "🔇" });
    } else {
      if (!localAudioRef.current) {
        const audio = new Audio();
        audio.srcObject = localStreamRef.current;
        audio.volume = 1.0;
        audio.muted = false;
        localAudioRef.current = audio;
      }
      localAudioRef.current.play();
      setIsSelfMonitoring(true);
      toast("Self-monitoring on - You can hear yourself", { icon: "🎧" });
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast(audioTrack.enabled ? "Unmuted" : "Muted", {
          icon: audioTrack.enabled ? "🎤" : "🔇",
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
        <span className="voice-chat-icon">
          <MicOff size={14} />
        </span>
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
          <span className="voice-chat-icon">
            <Mic size={14} />
          </span>
          <span>Join Voice</span>
        </button>
      ) : (
        <>
          <button
            className={`voice-chat-btn mute ${isMuted ? "muted" : ""}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            <span className="voice-chat-icon">
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </span>
            <span>{isMuted ? "Muted" : "Mute"}</span>
          </button>
          <button
            className={`voice-chat-btn monitor ${isSelfMonitoring ? "active" : ""}`}
            onClick={toggleSelfMonitoring}
            title={isSelfMonitoring ? "Stop hearing yourself" : "Hear yourself"}
          >
            <span className="voice-chat-icon">
              {isSelfMonitoring ? <Headphones size={14} /> : <Ear size={14} />}
            </span>
            <span>{isSelfMonitoring ? "Monitoring" : "Hear Me"}</span>
          </button>
          <button
            className="voice-chat-btn leave"
            onClick={stopVoiceChat}
            title="Leave voice chat"
          >
            <span className="voice-chat-icon">
              <PhoneOff size={14} />
            </span>
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
                    <Circle size={8} fill="currentColor" />
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
