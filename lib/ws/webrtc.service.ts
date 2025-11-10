// webRtcService.ts
import EventEmitter from 'eventemitter3';
import {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    MediaStream,
    mediaDevices,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { CallSignalType, CallType } from '../enums/call.enums';
import { CallSignal } from '../types/call.types';

/**
 * Event names and payloads produced by the service
 */
export type WebRTCEvents =
    | ['signal', (signal: CallSignal) => void]
    | ['localStream', (stream: MediaStream) => void]
    | ['remoteStream', (stream: MediaStream) => void]
    | ['callEnded', () => void]
    | ['connectionState', (state: RTCPeerConnectionState) => void]
    | ['iceConnectionState', (state: RTCIceConnectionState) => void]
    | ['iceGatheringState', (state: RTCIceGatheringState) => void]
    | ['error', (err: any) => void];

/**
 * ICE servers configuration
 * Move credentials to env vars / secure storage for production.
 */
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.relay.metered.ca:80' },
        {
            urls: 'turn:global.relay.metered.ca:80',
            username: process.env.METERED_TURN_USER || '44f703a3de3535ff2c736f55',
            credential: process.env.METERED_TURN_PASS || '8VlwQRJWaK70Y1PH',
        },
        {
            urls: 'turn:global.relay.metered.ca:80?transport=tcp',
            username: process.env.METERED_TURN_USER || '44f703a3de3535ff2c736f55',
            credential: process.env.METERED_TURN_PASS || '8VlwQRJWaK70Y1PH',
        },
        {
            urls: 'turn:global.relay.metered.ca:443',
            username: process.env.METERED_TURN_USER || '44f703a3de3535ff2c736f55',
            credential: process.env.METERED_TURN_PASS || '8VlwQRJWaK70Y1PH',
        },
        {
            urls: 'turns:global.relay.metered.ca:443?transport=tcp',
            username: process.env.METERED_TURN_USER || '44f703a3de3535ff2c736f55',
            credential: process.env.METERED_TURN_PASS || '8VlwQRJWaK70Y1PH',
        },
    ],
    iceCandidatePoolSize: 10,
};

export class WebRTCService extends EventEmitter {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;

    private currentCallId: string | null = null;
    private currentCallType: CallType | null = null;
    private localUserId: string | null = null;
    private remoteUserId: string | null = null;
    private isInitiator = false;
    private isEnding = false;
    private isSpeakerEnabled = true;

    // Queue for ICE candidates that arrive before peer connection is ready
    private iceCandidateQueue: RTCIceCandidateInit[] = [];

    // ------------------------
    // Public API
    // ------------------------

    async startCall(callType: CallType, callId: string, localUserId: string, remoteUserId: string): Promise<MediaStream> {
        return this.prepareCall({ callType, callId, localUserId, remoteUserId, isInitiator: true });
    }

    async answerCall(callType: CallType, callId: string, localUserId: string, remoteUserId: string): Promise<MediaStream> {
        return this.prepareCall({ callType, callId, localUserId, remoteUserId, isInitiator: false });
    }

    /**
     * Create an offer and emit a signal event with the offer payload
     */
    async createAndSendOffer() {
        if (!this.peerConnection) {
            this.emit('error', new Error('PeerConnection not initialized.'));
            return;
        }

        try {
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.currentCallType === CallType.VIDEO,
            });

            await this.peerConnection.setLocalDescription(offer);

            const signal: CallSignal = {
                type: CallSignalType.OFFER,
                callerId: this.localUserId || '',
                recipientId: this.remoteUserId || '',
                callType: this.currentCallType || CallType.VIDEO,
                offer,
                callId: this.currentCallId || undefined,
            };

            this.emit('signal', signal);
        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    }

    async handleOffer(offer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) {
            this.emit('error', new Error('PeerConnection not initialized.'));
            return;
        }
        if (!offer.sdp) throw new Error('Offer SDP missing');

        try {
            await this.safeSetRemoteDescription(offer);

            // Process any queued ICE candidates now that remote description is set
            await this.processQueuedIceCandidates();

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            const signal: CallSignal = {
                type: CallSignalType.ANSWER,
                callerId: this.localUserId || '',
                recipientId: this.remoteUserId || '',
                callType: this.currentCallType || CallType.VIDEO,
                answer,
                callId: this.currentCallId || undefined,
            };

            this.emit('signal', signal);
        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    }

    async handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) {
            this.emit('error', new Error('PeerConnection not initialized.'));
            return;
        }
        if (!answer.sdp) throw new Error('Answer SDP missing');

        try {
            await this.safeSetRemoteDescription(answer);

            // Process any queued ICE candidates now that remote description is set
            await this.processQueuedIceCandidates();
        } catch (err) {
            this.emit('error', err);
            throw err;
        }
    }

    async handleIceCandidate(candidate: RTCIceCandidateInit) {
        if (!candidate.candidate) {
            // End of candidates
            return;
        }

        if (!this.peerConnection) {
            // Queue the candidate to be processed once peer connection is ready
            console.log('[WebRTCService] Queuing ICE candidate, peer connection not ready yet');
            this.iceCandidateQueue.push(candidate);
            return;
        }

        // Check if remote description is set
        if (!this.peerConnection.remoteDescription) {
            console.log('[WebRTCService] Queuing ICE candidate, remote description not set yet');
            this.iceCandidateQueue.push(candidate);
            return;
        }

        try {
            console.log('[WebRTCService] Adding ICE candidate');
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate as any));
        } catch (err) {
            console.error('[WebRTCService] Error adding ICE candidate:', err);
            this.emit('error', err);
        }
    }

    private async processQueuedIceCandidates() {
        if (this.iceCandidateQueue.length === 0) return;

        console.log(`[WebRTCService] Processing ${this.iceCandidateQueue.length} queued ICE candidates`);

        // Store current queue and clear it before processing
        // This prevents infinite loop if candidates get re-queued during processing
        const candidatesToProcess = [...this.iceCandidateQueue];
        this.iceCandidateQueue = [];

        for (const candidate of candidatesToProcess) {
            await this.handleIceCandidate(candidate);
        }
    }

    toggleMicrophone(): boolean {
        if (!this.localStream) return false;
        const audio = this.localStream.getAudioTracks()[0];
        if (!audio) return false;
        audio.enabled = !audio.enabled;
        return audio.enabled;
    }

    toggleCamera(): boolean {
        if (!this.localStream) return false;
        const video = this.localStream.getVideoTracks()[0];
        if (!video) return false;
        video.enabled = !video.enabled;
        return video.enabled;
    }

    async switchCamera() {
        if (!this.localStream) return;
        const video = this.localStream.getVideoTracks()[0];
        if (!video) return;
        // react-native-webrtc vendor method
        // @ts-ignore
        if (typeof video._switchCamera === 'function') {
            // @ts-ignore
            video._switchCamera();
        }
    }

    async toggleSpeaker(): Promise<boolean> {
        this.isSpeakerEnabled = !this.isSpeakerEnabled;
        try {
            InCallManager.setForceSpeakerphoneOn(this.isSpeakerEnabled);
        } catch (err) {
            this.emit('error', err);
        }
        return this.isSpeakerEnabled;
    }

    endCall() {
        if (this.isEnding) {
            console.log('[WebRTCService] Already ending call, skipping');
            return;
        }
        this.isEnding = true;

        console.log('[WebRTCService] Ending call:', this.currentCallId);

        try {
            // Stop local stream tracks
            if (this.localStream) {
                console.log('[WebRTCService] Stopping local stream tracks');
                this.localStream.getTracks().forEach((t) => {
                    t.stop();
                    console.log('[WebRTCService] Stopped track:', t.kind);
                });
                this.localStream = null;
            }

            // Stop remote stream tracks
            if (this.remoteStream) {
                console.log('[WebRTCService] Stopping remote stream tracks');
                this.remoteStream.getTracks().forEach((t) => t.stop());
                this.remoteStream = null;
            }

            // Close peer connection
            if (this.peerConnection) {
                console.log('[WebRTCService] Closing peer connection');
                try {
                    this.peerConnection.close();
                } catch (err) {
                    console.error('[WebRTCService] Error closing peer connection:', err);
                }
                this.peerConnection = null;
            }

            // Reset state
            this.currentCallId = null;
            this.currentCallType = null;
            this.localUserId = null;
            this.remoteUserId = null;
            this.isInitiator = false;
            this.iceCandidateQueue = [];

            // Stop InCallManager
            try {
                InCallManager.stop();
                console.log('[WebRTCService] Stopped InCallManager');
            } catch (err) {
                console.error('[WebRTCService] Error stopping InCallManager:', err);
            }

            // Notify listeners (they will handle their own cleanup)
            this.emit('callEnded');

            console.log('[WebRTCService] Call ended successfully');
        } finally {
            this.isEnding = false;
        }
    }

    // ------------------------
    // Getters
    // ------------------------
    getCurrentCallId(): string | null {
        return this.currentCallId;
    }
    getIsInitiator(): boolean {
        return this.isInitiator;
    }
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }
    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }
    isPeerConnectionInitialized(): boolean {
        return this.peerConnection !== null;
    }

    // ------------------------
    // Private helpers
    // ------------------------

    private async prepareCall({
        callType,
        callId,
        localUserId,
        remoteUserId,
        isInitiator,
    }: {
        callType: CallType;
        callId: string;
        localUserId: string;
        remoteUserId: string;
        isInitiator: boolean;
    }) {
        console.log('[WebRTCService] prepareCall:', {
            callType,
            callId,
            localUserId,
            remoteUserId,
            isInitiator,
            existingCallId: this.currentCallId,
            hasPeerConnection: !!this.peerConnection
        });

        // If there's an existing peer connection, clean it up first
        if (this.peerConnection && this.currentCallId !== callId) {
            console.warn('[WebRTCService] Existing peer connection found, cleaning up before new call');
            this.endCall();
            // Wait a bit for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.currentCallId = callId;
        this.currentCallType = callType;
        this.localUserId = localUserId;
        this.remoteUserId = remoteUserId;
        this.isInitiator = isInitiator;

        console.log('[WebRTCService] Set IDs:', {
            'this.localUserId': this.localUserId,
            'this.remoteUserId': this.remoteUserId
        });

        this.configureAudioSession();
        this.startInCallManager();

        try {
            const stream = await this.getUserMedia(callType);
            this.localStream = stream;
            this.emit('localStream', stream);

            this.initPeerConnectionIfNeeded();
            this.addLocalTracks(stream);

            return stream;
        } catch (err) {
            this.emit('error', err);
            this.endCall();
            throw err;
        }
    }

    private initPeerConnectionIfNeeded() {
        if (this.peerConnection) {
            console.warn('[WebRTCService] Peer connection already exists, skipping initialization');
            return;
        }

        console.log('[WebRTCService] Initializing new peer connection for call:', this.currentCallId);
        this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

        this.peerConnection.onicecandidate = (event) => {
            const candidate = event.candidate;
            if (candidate) {
                console.log('[WebRTCService] Creating ICE_CANDIDATE signal:', {
                    'this.localUserId': this.localUserId,
                    'this.remoteUserId': this.remoteUserId
                });

                const signal: CallSignal = {
                    type: CallSignalType.ICE_CANDIDATE,
                    callerId: this.localUserId || '',
                    recipientId: this.remoteUserId || '',
                    callType: this.currentCallType || CallType.VIDEO,
                    candidate: candidate.toJSON(),
                    callId: this.currentCallId || undefined,
                };

                console.log('[WebRTCService] Emitting ICE_CANDIDATE signal:', {
                    callerId: signal.callerId,
                    recipientId: signal.recipientId,
                    callId: signal.callId
                });

                this.emit('signal', signal);
            }
        };

        this.peerConnection.ontrack = (event) => {
            const ms = event.streams && event.streams[0] ? event.streams[0] : null;
            if (ms) {
                this.remoteStream = ms;
                this.emit('remoteStream', ms);
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            if (state) this.emit('connectionState', state);
            if (this.isEnding) return;
            if (state === 'failed') {
                this.emit('error', new Error('Peer connection failed'));
                this.endCall();
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState;
            if (state) this.emit('iceConnectionState', state);
            if (this.isEnding) return;
            if (state === 'failed') {
                this.emit('error', new Error('ICE connection failed - check TURN'));
            }
        };

        this.peerConnection.onicegatheringstatechange = () => {
            const state = this.peerConnection?.iceGatheringState;
            if (state) this.emit('iceGatheringState', state);
        };
    }

    private addLocalTracks(stream: MediaStream) {
        if (!this.peerConnection || !stream) return;
        const tracks = stream.getTracks();
        tracks.forEach((t) => this.peerConnection?.addTrack(t, stream));
    }

    private startInCallManager() {
        try {
            InCallManager.start({ media: this.currentCallType === CallType.VIDEO ? 'video' : 'audio' });
            InCallManager.setForceSpeakerphoneOn(this.isSpeakerEnabled);
        } catch (err) {
            this.emit('error', err);
        }
    }

    private configureAudioSession() {
        try {
            if (mediaDevices?.enumerateDevices) {
                mediaDevices.enumerateDevices().then((devices) => {
                    // optional: log devices for debugging
                    // console.log('mediaDevices:', devices);
                });
            }
        } catch (err) {
            // ignore
        }
    }

    private async getUserMedia(callType: CallType): Promise<MediaStream> {
        const constraints: MediaStreamConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                // @ts-ignore RN specific
                sampleRate: 48000,
            },
            video:
                callType === CallType.VIDEO
                    ? {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }
                    : false,
        };

        try {
            const stream = await mediaDevices.getUserMedia(constraints as unknown as import('react-native-webrtc').MediaStreamConstraints);
            return stream as MediaStream;
        } catch (err) {
            this.emit('error', err);
            throw new Error('Failed to access camera/microphone');
        }
    }

    private async safeSetRemoteDescription(desc: RTCSessionDescriptionInit) {
        if (!this.peerConnection) throw new Error('PeerConnection not initialized');
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(desc as any));
    }
}

/**
 * Export a single shared instance
 */
export const webRTCService = new WebRTCService();
export default webRTCService;

/**
 * ---------------------------
 * Example usage (in a component)
 * ---------------------------
 *
 * import webRTCService, { CallType, CallSignalType } from './webRtcService';
 *
 * // Subscribe
 * useEffect(() => {
 *   const onLocal = (s: MediaStream) => setLocalStream(s);
 *   const onRemote = (s: MediaStream) => setRemoteStream(s);
 *   const onSignal = (sig: CallSignal) => socket.emit('signal', sig);
 *   const onError = (e: any) => console.error(e);
 *
 *   webRTCService.on('localStream', onLocal);
 *   webRTCService.on('remoteStream', onRemote);
 *   webRTCService.on('signal', onSignal);
 *   webRTCService.on('error', onError);
 *
 *   return () => {
 *     webRTCService.off('localStream', onLocal);
 *     webRTCService.off('remoteStream', onRemote);
 *     webRTCService.off('signal', onSignal);
 *     webRTCService.off('error', onError);
 *   };
 * }, []);
 *
 * // Start call
 * await webRTCService.startCall(CallType.VIDEO, 'call-123');
 * // Later: create offer to send via signaling transport
 * await webRTCService.createAndSendOffer();
 *
 * // Incoming signals from socket:
 * socket.on('signal', (sig) => {
 *   if (sig.type === CallSignalType.OFFER) webRTCService.handleOffer(sig.offer!);
 *   if (sig.type === CallSignalType.ANSWER) webRTCService.handleAnswer(sig.answer!);
 *   if (sig.type === CallSignalType.ICE_CANDIDATE) webRTCService.handleIceCandidate(sig.candidate!);
 * });
 *
 */

