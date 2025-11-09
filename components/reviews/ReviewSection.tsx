import { useAuth } from '@/contexts/auth.context';
import {
  useDriverRating,
  useDriverReviews,
  useHasCompletedTrip,
  useUserReviewForDriver
} from '@/hooks/queries/review.queries';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RatingStars } from './RatingStars';
import { ReviewItem } from './ReviewItem';
import { ReviewModal } from './ReviewModal';

interface ReviewSectionProps {
  driverId: string;
  driverName: string;
  compact?: boolean;
  showAllReviews?: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  driverId,
  driverName,
  compact = false,
  showAllReviews = false
}) => {
  const { user } = useAuth();
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(showAllReviews);
  
  const { data: driverRating, isLoading: isLoadingRating, error: ratingError } = useDriverRating(driverId);
  const { data: userReview, isLoading: isLoadingUserReview } = useUserReviewForDriver(
    driverId, 
    user?.uid || ''
  );
  const { data: reviews, isLoading: isLoadingReviews } = useDriverReviews(driverId);
  const { data: hasCompletedTrip } = useHasCompletedTrip(user?.uid || '', driverId);

  const canReview = user && 
                   user.uid !== driverId && 
                   hasCompletedTrip &&
                   !userReview;

  const canEditReview = user && userReview;

  const reviewsList = reviews || [];
  const recentReviews = showAll ? reviewsList : reviewsList.slice(0, 3);
  const totalReviews = reviewsList.length;

  const handleAddReview = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour donner un avis');
      return;
    }
    
    if (!hasCompletedTrip) {
      Alert.alert(
        'Action non autorisée', 
        'Vous devez avoir effectué un trajet avec ce conducteur pour pouvoir le noter.'
      );
      return;
    }

    setReviewModalVisible(true);
  };

  const handleEditReview = () => {
    setReviewModalVisible(true);
  };

  if (isLoadingRating || isLoadingUserReview) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement des avis...</Text>
      </View>
    );
  }

  if (ratingError) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={styles.errorText}>Erreur lors du chargement des avis</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={styles.ratingSummary}>
          <View style={styles.ratingNumber}>
            <Text style={styles.averageRating}>
              {driverRating?.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.ratingOutOf}>/5</Text>
          </View>
          <View style={styles.ratingDetails}>
            <RatingStars 
              rating={driverRating?.averageRating || 0} 
              size={compact ? 16 : 20} 
            />
            <Text style={styles.reviewCount}>
              {driverRating?.totalReviews || 0} {driverRating?.totalReviews === 1 ? 'avis' : 'avis'}
            </Text>
          </View>
        </View>

        {user && user.uid !== driverId && (
          <View style={styles.actionButtons}>
            {canReview && (
              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={handleAddReview}
              >
                <Ionicons name="star-outline" size={16} color="#2563EB" />
                <Text style={styles.reviewButtonText}>Noter</Text>
              </TouchableOpacity>
            )}
            {canEditReview && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditReview}
              >
                <Ionicons name="create-outline" size={16} color="#6B7280" />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {totalReviews > 0 && (
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Avis récents</Text>
          
          <ScrollView 
            style={styles.reviewsList}
            scrollEnabled={showAll}
            nestedScrollEnabled={true}
          >
            {recentReviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                isCurrentUserReview={review.reviewer?.uid === user?.uid}
              />
            ))}
          </ScrollView>

          {totalReviews > 3 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'Voir moins' : `Voir tous les ${totalReviews} avis`}
              </Text>
              <Ionicons 
                name={showAll ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#2563EB" 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {totalReviews === 0 && (
        <View style={styles.noReviews}>
          <Ionicons name="star-outline" size={32} color="#D1D5DB" />
          {canReview && (
            <TouchableOpacity 
              style={styles.firstReviewButton}
              onPress={handleAddReview}
            >
              <Text style={styles.firstReviewButtonText}>Soyez le premier à noter</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ReviewModal
        visible={isReviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        driverId={driverId}
        driverName={driverName}
        existingReview={userReview ? {
          id: userReview.id,
          rating: userReview.rating,
          comment: userReview.comment
        } : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  compactContainer: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingNumber: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  averageRating: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  ratingOutOf: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 2,
  },
  ratingDetails: {
    gap: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    gap: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  reviewButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  reviewsContainer: {
    marginTop: 8,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  reviewsList: {
    maxHeight: 300,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  firstReviewButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  firstReviewButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
});

export default ReviewSection;