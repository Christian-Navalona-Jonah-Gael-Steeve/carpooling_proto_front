import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWebRTC } from '@/contexts/webrtc.context';
import { CallType } from '@/lib/enums/call.enums';
import { getParticipantDisplayName } from '@/lib/utils/participant.utils';

const { width } = Dimensions.get('window');

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, answerCall, rejectCall } = useWebRTC();

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.callType === CallType.VIDEO;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Call Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={isVideoCall ? "videocam" : "call"}
              size={60}
              color="#2563EB"
            />
          </View>

          {/* Caller Info */}
          <Text style={styles.callerName}>
            {getParticipantDisplayName(incomingCall.caller)}
          </Text>
          <Text style={styles.callType}>
            {isVideoCall ? 'Appel vidéo' : 'Appel audio'} entrant...
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Reject Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={rejectCall}
              accessibilityLabel="Rejeter l'appel"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={answerCall}
              accessibilityLabel="Accepter l'appel"
              accessibilityRole="button"
            >
              <Ionicons name={isVideoCall ? "videocam" : "call"} size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  callType: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
});
