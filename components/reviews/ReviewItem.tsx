import { IReview } from '@/lib/types/review.types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RatingStars } from './RatingStars';

interface ReviewItemProps {
  review: IReview;
  showDriverInfo?: boolean;
  isCurrentUserReview?: boolean;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  showDriverInfo = false,
  isCurrentUserReview = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <View style={[
      styles.container,
      isCurrentUserReview && styles.currentUserReview
    ]}>
      <View style={styles.header}>
        <View style={styles.reviewerInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.reviewerName}>
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </Text>
            {isCurrentUserReview && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>Vous</Text>
              </View>
            )}
          </View>
          <RatingStars rating={review.rating} size={16} />
        </View>
        <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
      </View>
      
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentUserReview: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewerInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  youBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});