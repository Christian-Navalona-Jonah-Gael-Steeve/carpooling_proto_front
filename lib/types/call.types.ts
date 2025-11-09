import { CallSignalType, CallType } from "../enums/call.enums";

export interface CallSignal {
    type: CallSignalType;
    callerId: string;
    recipientId: string;
    callType: CallType;
    callerFirstName?: string;
    callerLastName?: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    callId?: string;
}