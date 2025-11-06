import { useAuth } from '@/contexts/auth.context'; // Import pour récupérer l'utilisateur
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCreateReview, useUpdateReview } from '../../hooks/queries/review.queries';
import { RatingStars } from './RatingStars';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  existingReview?: {
    id: number;
    rating: number;
    comment?: string;
  };
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  driverId,
  driverName,
  existingReview,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const { user } = useAuth(); // Récupérer l'utilisateur connecté
  
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();

  const isEditing = !!existingReview;
  // Utiliser isPending au lieu de isLoading
  const isLoading = createReviewMutation.isPending || updateReviewMutation.isPending;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez donner une note');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour donner un avis');
      return;
    }

    try {
      if (isEditing && existingReview) {
        await updateReviewMutation.mutateAsync({
          reviewId: existingReview.id,
          data: { rating, comment }
        });
      } else {
        await createReviewMutation.mutateAsync({
          reviewerId: user.uid, // Utiliser l'UID de l'utilisateur connecté
          driverId,
          rating,
          comment: comment || undefined,
        });
      }
      
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre votre avis');
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Modifier votre avis' : `Noter ${driverName}`}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>Votre note</Text>
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              editable={true}
              size={32}
            />
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating}/5` : 'Sélectionnez une note'}
            </Text>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Votre commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Partagez votre expérience avec ce conducteur..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (rating === 0 || isLoading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Envoi...' : isEditing ? 'Modifier' : 'Soumettre'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});