import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useWebRTC } from './WebRTCProvider';

interface CallControlsProps {
  mini?: boolean; // compact variant
}

const CallControls: React.FC<CallControlsProps> = ({ mini = false }) => {
  const {
    isCallActive,
    isIncomingCall,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    formattedCallDuration,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    endCall,
  } = useWebRTC();

  if (!isCallActive && !isIncomingCall) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(20,20,20,0.95)',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        pointerEvents: 'auto',
      }}>
        {/* Status */}
        <div style={{ minWidth: 120 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {isIncomingCall ? 'Incoming call' : (remoteUser?.username || 'In call')}
          </div>
          {!isIncomingCall && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{formattedCallDuration}</div>
          )}
        </div>

        {/* Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={buttonStyle(isMuted)}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Toggle video (only show if call type is video or video track exists) */}
        {((callType === 'video') || (localStream && localStream.getVideoTracks().length > 0)) && (
          <button
            onClick={toggleVideo}
            title={isVideoEnabled ? 'Turn video off' : 'Turn video on'}
            style={buttonStyle(!isVideoEnabled)}
          >
            {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        )}

        {/* End call */}
        <button
          onClick={endCall}
          title="End call"
          style={{
            ...buttonStyle(false),
            background: '#e11d48',
          }}
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
};

const buttonStyle = (active: boolean): React.CSSProperties => ({
  outline: 'none',
  border: '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
  color: '#fff',
  padding: '8px 10px',
  borderRadius: 8,
  cursor: 'pointer',
});

export default CallControls;