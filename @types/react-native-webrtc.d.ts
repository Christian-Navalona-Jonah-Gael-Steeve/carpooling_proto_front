declare module 'react-native-webrtc' {
  export interface RTCSessionDescriptionInit {
    type: RTCSdpType;
    sdp?: string;
  }

  export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    usernameFragment?: string | null;
  }

  export class RTCPeerConnection {
    constructor(configuration?: RTCConfiguration);

    localDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    signalingState: RTCSignalingState;
    iceGatheringState: RTCIceGatheringState;
    iceConnectionState: RTCIceConnectionState;
    connectionState: RTCPeerConnectionState;

    onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
    ontrack: ((event: RTCTrackEvent) => void) | null;
    onconnectionstatechange: (() => void) | null;
    oniceconnectionstatechange: (() => void) | null;
    onsignalingstatechange: (() => void) | null;
    onicegatheringstatechange : (() => void) | null;

    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    close(): void;
  }

  export class RTCSessionDescription {
    constructor(descriptionInitDict: RTCSessionDescriptionInit);
    type: RTCSdpType;
    sdp: string;
    toJSON(): RTCSessionDescriptionInit;
  }

  export class RTCIceCandidate {
    constructor(candidateInitDict: RTCIceCandidateInit);
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    toJSON(): RTCIceCandidateInit;
  }

  export interface RTCConfiguration {
    iceServers?: RTCIceServer[];
  }

  export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
  }

  export interface RTCOfferOptions {
    offerToReceiveAudio?: boolean;
    offerToReceiveVideo?: boolean;
  }

  export interface RTCAnswerOptions {
    // Answer options
  }

  export interface RTCPeerConnectionIceEvent {
    candidate: RTCIceCandidate | null;
  }

  export interface RTCTrackEvent {
    track: MediaStreamTrack;
    streams: MediaStream[];
  }

  export type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';
  export type RTCSignalingState = 'stable' | 'have-local-offer' | 'have-remote-offer' | 'have-local-pranswer' | 'have-remote-pranswer' | 'closed';
  export type RTCIceGatheringState = 'new' | 'gathering' | 'complete';
  export type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  export type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

  export class MediaStream {
    id: string;
    active: boolean;

    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
    toURL(): string;
    release(): void;
  }

  export interface MediaStreamTrack {
    enabled: boolean;
    id: string;
    kind: string;
    label: string;
    muted: boolean;
    readyState: 'live' | 'ended';

    stop(): void;
    _switchCamera?(): void;
  }

  export class RTCRtpSender {
    track: MediaStreamTrack | null;
  }

  export const mediaDevices: {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    enumerateDevices(): Promise<MediaDeviceInfo[]>;
  };

  export interface MediaStreamConstraints {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
  }

  export interface MediaTrackConstraints {
    facingMode?: string | { exact: string } | { ideal: string };
    width?: number | { min?: number; max?: number; ideal?: number; exact?: number };
    height?: number | { min?: number; max?: number; ideal?: number; exact?: number };
    frameRate?: number | { min?: number; max?: number; ideal?: number; exact?: number };
  }

  export interface MediaDeviceInfo {
    deviceId: string;
    groupId: string;
    kind: 'audioinput' | 'audiooutput' | 'videoinput';
    label: string;
  }

  export interface RTCViewProps {
    streamURL: string;
    style?: any;
    objectFit?: 'contain' | 'cover';
    mirror?: boolean;
    zOrder?: number;
  }

  export const RTCView: React.ComponentType<RTCViewProps>;
}
