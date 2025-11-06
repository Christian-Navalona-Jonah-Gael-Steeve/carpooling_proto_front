import React, { useState } from 'react';

import { useAuth } from '@/contexts/auth.context';
import { useDriverRating, useDriverReviews, useHasCompletedTrip, useUserReviewForDriver } from '@/hooks/queries/review.queries';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RatingStars } from './RatingStars';
import { ReviewItem } from './ReviewItem';
import { ReviewModal } from './ReviewModal';

interface ReviewSectionProps {
  driverId: string;
  driverName: string;
  compact?: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  driverId,
  driverName,
  compact = false,
}) => {
  const { user } = useAuth();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const { data: reviews, isLoading: reviewsLoading } = useDriverReviews(driverId);
  const { data: rating, isLoading: ratingLoading } = useDriverRating(driverId);
  const { data: userReview } = useUserReviewForDriver(driverId, user?.uid || '');
  const { data: hasCompletedTrip, isLoading: tripCheckLoading } = useHasCompletedTrip(user?.uid || '', driverId);

  const isLoading = reviewsLoading || ratingLoading || tripCheckLoading;
  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, compact ? 2 : 3);

  const canReview = user && 
                   user.uid !== driverId && 
                   !userReview &&
                   hasCompletedTrip;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Chargement des avis...</Text>
        </View>
      </View>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Avis</Text>
          
          {user && user.uid !== driverId && (
            hasCompletedTrip ? (
              <TouchableOpacity 
                style={styles.addReviewButton}
                onPress={() => setReviewModalVisible(true)}
              >
                <Ionicons name="star-outline" size={16} color="#2563EB" />
                <Text style={styles.addReviewText}>Donner un avis</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.cannotReviewBadge}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.cannotReviewText}>Course requise</Text>
              </View>
            )
          )}
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Aucun avis</Text>
          <Text style={styles.emptyStateText}>
            {hasCompletedTrip 
              ? `Soyez le premier à donner votre avis sur ${driverName}`
              : `Aucun avis pour ${driverName}`
            }
          </Text>
          
          {user && user.uid !== driverId && !hasCompletedTrip && (
            <Text style={styles.infoText}>
              Effectuez une course avec ce conducteur pour pouvoir le noter
            </Text>
          )}
        </View>

        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          driverId={driverId}
          driverName={driverName}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Avis</Text>
          <View style={styles.ratingSummary}>
            <Text style={styles.averageRating}>{rating?.averageRating?.toFixed(1) || '0.0'}</Text>
            <RatingStars rating={rating?.averageRating || 0} size={16} />
            <Text style={styles.reviewCount}>({rating?.totalReviews || 0})</Text>
          </View>
        </View>

        {canReview && (
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={() => setReviewModalVisible(true)}
          >
            <Ionicons name="star-outline" size={16} color="#2563EB" />
            <Text style={styles.addReviewText}>Votre avis</Text>
          </TouchableOpacity>
        )}

        {userReview && (
          <View style={styles.userReviewedBadge}>
            <Ionicons name="star" size={14} color="#059669" />
            <Text style={styles.userReviewedText}>Vous avez noté</Text>
          </View>
        )}

        {user && user.uid !== driverId && !hasCompletedTrip && !userReview && (
          <View style={styles.cannotReviewBadge}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.cannotReviewText}>Course requise</Text>
          </View>
        )}
      </View>


      {displayedReviews?.map((review) => (
        <ReviewItem 
          key={review.id} 
          review={review} 
          isCurrentUserReview={review.reviewerId === user?.uid}
        />
      ))}

      {reviews.length > (compact ? 2 : 3) && (
        <TouchableOpacity 
          style={styles.showMoreButton}
          onPress={() => setShowAllReviews(!showAllReviews)}
        >
          <Text style={styles.showMoreText}>
            {showAllReviews ? 'Voir moins' : `Voir tous les avis (${reviews.length})`}
          </Text>
          <Ionicons 
            name={showAllReviews ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#2563EB" 
          />
        </TouchableOpacity>
      )}

      <ReviewModal
        visible={reviewModalVisible}
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
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  averageRating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  addReviewText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  userReviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
  },
  userReviewedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  cannotReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  cannotReviewText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
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
    fontWeight: '500',
  },
});