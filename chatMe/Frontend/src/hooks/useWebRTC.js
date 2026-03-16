import { useState, useEffect, useRef } from 'react';

export const useWebRTC = (socket, selectedUser, user) => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState("video");
  const [isCalling, setIsCalling] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  const peerRef = useRef();
  const pendingCandidates = useRef([]);

  useEffect(() => {
    socket.on("hey", (data) => {
      console.log("Incoming call from:", data.from);
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
      setCallType(data.type);
    });

    socket.on("callEnded", () => {
      endCallLocally();
    });

    socket.on("iceCandidate", (candidate) => {
      if (peerRef.current && peerRef.current.remoteDescription) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(e => console.warn("Error adding ICE candidate", e));
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("callAccepted", (signal) => {
      console.log("Call accepted by remote");
      setCallAccepted(true);
      if (peerRef.current) {
        peerRef.current.setRemoteDescription(new RTCSessionDescription(signal))
          .then(() => {
            // Process any candidates that arrived early
            while (pendingCandidates.current.length > 0) {
              const cand = pendingCandidates.current.shift();
              peerRef.current.addIceCandidate(new RTCIceCandidate(cand));
            }
          })
          .catch(e => console.error("Remote desc error", e));
      }
    });

    return () => {
      socket.off("hey");
      socket.off("callEnded");
      socket.off("iceCandidate");
      socket.off("callAccepted");
    };
  }, [socket]);

  const endCallLocally = () => {
    if (myStream) {
      myStream.getTracks().forEach(t => t.stop());
      setMyStream(null);
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    pendingCandidates.current = [];
    setCallAccepted(false);
    setIsCalling(false);
    setReceivingCall(false);
    setRemoteStream(null);
  };

  const createPeer = (targetId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }
      ]
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("iceCandidate", { to: targetId, candidate: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      console.log("Remote track received:", e.track.kind);
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
      }
    };

    return peer;
  };

  const startCall = async (type) => {
    if (!selectedUser) return;
    setIsCalling(true);
    setCallType(type);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: true
      });
      setMyStream(stream);

      const peer = createPeer(selectedUser.id);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: selectedUser.id,
        signalData: offer,
        from: socket.id,
        type: type
      });

      peerRef.current = peer;
    } catch (err) {
      setIsCalling(false);
      console.error("Failed to get local stream", err);
    }
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video' ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: true
      });
      setMyStream(stream);

      const peer = createPeer(caller);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
      
      // Process late candidates
      while (pendingCandidates.current.length > 0) {
        const cand = pendingCandidates.current.shift();
        peer.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answerCall", { signal: answer, to: caller });

      peerRef.current = peer;
    } catch (err) {
      console.error("Error answering call", err);
      endCallLocally();
    }
  };

  const switchCamera = async () => {
    if (!myStream || !peerRef.current) return;
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      
      const videoTrack = newStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
      
      myStream.getVideoTracks().forEach(t => t.stop());
      setMyStream(newStream);
    } catch (e) { 
      console.error("Camera switch failed", e); 
    }
  };

  return {
    myStream, remoteStream, receivingCall, caller, callAccepted, callType, isCalling,
    startCall, answerCall, leaveCall: () => { 
        socket.emit("endCall", { to: selectedUser?.id || caller });
        endCallLocally(); 
    },
    switchCamera, setReceivingCall
  };
};
