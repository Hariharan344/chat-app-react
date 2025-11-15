import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
// Lightweight message shim to avoid external UI deps
const message = { success: console.log, info: console.log, error: console.error } as const;
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { httpClient } from '../services/httpClient';

// WebRTC context types
export type CallType = 'audio' | 'video';

export interface RemoteUser {
  id: string;
  username?: string;
}

interface WebRTCContextValue {
  isCallActive: boolean;
  isIncomingCall: boolean;
  callType: CallType | null;
  remoteUser: RemoteUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  formattedCallDuration: string;
  // Media controls
  isMuted: boolean;
  isVideoEnabled: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  // Call actions
  initiateCall: (userId: string, username?: string, type?: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

const peerConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [remoteUser, setRemoteUser] = useState<RemoteUser | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const loggedInUser = useMemo(() => {
    const auth = httpClient.getAuthData();
    return auth?.userId || localStorage.getItem('userId') || localStorage.getItem('id') || '';
  }, []);

  const token = useMemo(() => {
    const auth = httpClient.getAuthData();
    return auth?.accesstoken || localStorage.getItem('accessToken') || '';
  }, []);

  // WebSocket connect (using same SockJS base as chat service)
  useEffect(() => {
    if (!loggedInUser || !token) return;

    const socket = new SockJS('http://localhost:8081/project/myapp/ws/chat');

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str) => console.log('WebRTC STOMP:', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebRTC STOMP connected');
      // Subscribe to Spring @SendToUser queue
      client.subscribe('/user/queue/call', (msg) => {
        try {
          const signal = JSON.parse(msg.body);
          console.log('WebRTC signal in:', signal);
          handleSignalingData(signal);
        } catch (e) {
          console.error('Failed to parse signal', e);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('WebRTC STOMP error:', frame.headers['message'], frame.body);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, token]);

  const startCallTimer = () => {
    if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    const start = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setCallDuration(Math.floor((Date.now() - start) / 1000));
    }, 1000) as unknown as number;
  };

  const formatCallDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetCallState = () => {
    setIsCallActive(false);
    setIsIncomingCall(false);
    setCallType(null);
    setRemoteUser(null);
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
  };

  // Map and send signals to backend endpoints
  const sendSignalingData = (data: any) => {
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      console.error('WebRTC socket not connected');
      return;
    }

    const payload: any = { ...data };
    if (data.senderId && !data.fromUserId) payload.fromUserId = data.senderId;
    if (data.receiverId && !data.toUserId) payload.toUserId = data.receiverId;

    let destination = '';
    switch (data.type) {
      case 'call-offer':
      case 'offer':
        payload.type = 'offer';
        destination = '/app/call.offer';
        break;
      case 'call-answer':
      case 'answer':
        payload.type = 'answer';
        destination = '/app/call.answer';
        break;
      case 'ice-candidate':
      case 'candidate':
        payload.type = 'candidate';
        destination = '/app/call.candidate';
        break;
      case 'call-end':
      case 'hangup':
      case 'reject':
      case 'ringing':
      case 'busy':
      case 'call-reconnect':
      case 'reconnect-answer':
        payload.type = data.type === 'call-end' ? 'hangup' : data.type;
        destination = '/app/call.event';
        break;
      default:
        console.warn('Unknown signaling type', data.type);
        return;
    }

    delete payload.senderId;
    delete payload.receiverId;

    client.publish({ destination, body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } });
  };

  const processPendingIceCandidates = async () => {
    if (pendingIceCandidatesRef.current.length && peerConnectionRef.current) {
      for (const c of pendingIceCandidatesRef.current) {
        try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(e); }
      }
      pendingIceCandidatesRef.current = [];
    }
  };

  // Incoming: offer
  const handleCallOffer = useCallback(async (signal: any) => {
    if (isCallActive) return; // ignore if in another call
    setIsIncomingCall(true);
    setCallType((signal.callType as CallType) || 'audio');
    setRemoteUser({ id: signal.fromUserId || signal.senderId, username: signal.senderName || 'User' });
    sessionStorage.setItem('pendingOffer', JSON.stringify(signal));
  }, [isCallActive]);

  // Incoming: answer (caller receives)
  const handleCallAnswer = useCallback(async (signal: any) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer));
    await processPendingIceCandidates();
    setIsCallActive(true);
    startCallTimer();
    message.success('Call connected');
  }, []);

  // Incoming: ICE
  const handleIceCandidate = useCallback(async (signal: any) => {
    if (!peerConnectionRef.current || peerConnectionRef.current.remoteDescription === null) {
      pendingIceCandidatesRef.current.push(signal.candidate);
      return;
    }
    try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch (e) { console.error(e); }
  }, []);

  // Incoming: end
  const handleCallEnd = useCallback(() => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    resetCallState();
    message.info('Call ended');
  }, [localStream]);

  const handleSignalingData = useCallback((signal: any) => {
    if (!signal || !signal.type) return;
    switch (signal.type) {
      case 'call-offer':
      case 'offer':
        handleCallOffer(signal);
        break;
      case 'call-answer':
      case 'answer':
        handleCallAnswer(signal);
        break;
      case 'ice-candidate':
      case 'candidate':
        handleIceCandidate(signal);
        break;
      case 'call-end':
      case 'hangup':
        handleCallEnd();
        break;
      default:
        console.log('Unhandled signal:', signal);
    }
  }, [handleCallOffer, handleCallAnswer, handleIceCandidate, handleCallEnd]);

  // Start an outgoing call (caller)
  const initiateCall: WebRTCContextValue['initiateCall'] = async (userId, username, type = 'audio') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(peerConfiguration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignalingData({ type: 'ice-candidate', senderId: loggedInUser, receiverId: userId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        setIsCallActive(true);
        startCallTimer();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setRemoteUser({ id: userId, username });
      setCallType(type);

      sendSignalingData({
        type: 'call-offer',
        senderId: loggedInUser,
        senderName: localStorage.getItem('username') || 'User',
        receiverId: userId,
        offer: pc.localDescription,
        callType: type,
      });
    } catch (e: any) {
      console.error('initiateCall error:', e);
      message.error(e?.message || 'Failed to start call');
      resetCallState();
    }
  };

  // Accept an incoming call (callee)
  const acceptCall: WebRTCContextValue['acceptCall'] = async () => {
    const pending = sessionStorage.getItem('pendingOffer');
    if (!pending) { message.error('No pending call'); return; }
    const signal = JSON.parse(pending);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: signal.callType === 'video' });
      setLocalStream(stream);

      const pc = new RTCPeerConnection(peerConfiguration);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignalingData({ type: 'ice-candidate', senderId: loggedInUser, receiverId: signal.fromUserId || signal.senderId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        setIsCallActive(true);
        startCallTimer();
      };

      await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
      await processPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setRemoteUser({ id: signal.fromUserId || signal.senderId, username: signal.senderName || 'User' });
      setCallType((signal.callType as CallType) || 'audio');
      setIsIncomingCall(false);

      sendSignalingData({ type: 'call-answer', senderId: loggedInUser, receiverId: signal.fromUserId || signal.senderId, answer: pc.localDescription });
      sessionStorage.removeItem('pendingOffer');
    } catch (e: any) {
      console.error('acceptCall error:', e);
      message.error(e?.message || 'Failed to accept call');
    }
  };

  // Reject the incoming call
  const rejectCall = () => {
    const pending = sessionStorage.getItem('pendingOffer');
    const signal = pending ? JSON.parse(pending) : null;
    if (signal) {
      sendSignalingData({ type: 'call-end', senderId: loggedInUser, receiverId: signal.fromUserId || signal.senderId });
      sessionStorage.removeItem('pendingOffer');
    }
    setIsIncomingCall(false);
  };

  // End the current call
  const endCall = () => {
    if (remoteUser) {
      sendSignalingData({ type: 'call-end', senderId: loggedInUser, receiverId: remoteUser.id });
    }
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    resetCallState();
  };

  // Toggle audio track mute state
  const toggleMute = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length) {
      const newEnabled = !audioTracks[0].enabled;
      audioTracks.forEach(t => (t.enabled = newEnabled));
      setIsMuted(!newEnabled);
    }
  };

  // Toggle video track enable state
  const toggleVideo = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length) {
      const newEnabled = !videoTracks[0].enabled;
      videoTracks.forEach(t => (t.enabled = newEnabled));
      setIsVideoEnabled(newEnabled);
    }
  };

  const ctx: WebRTCContextValue = {
    isCallActive,
    isIncomingCall,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    callDuration,
    formattedCallDuration: formatCallDuration(callDuration),
    // media controls
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    // actions
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  };

  return (
    <WebRTCContext.Provider value={ctx}>{children}</WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTC must be used within WebRTCProvider');
  return ctx;
};