import { useDriverRating } from '@/hooks/queries/review.queries';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DriverRatingDisplayProps {
  driverId: string;
  onPress?: () => void;
}

export const DriverRatingDisplay: React.FC<DriverRatingDisplayProps> = ({
  driverId,
  onPress,
}) => {
  const { data: ratingData, isLoading, isError } = useDriverRating(driverId);

  if (isLoading) {
    return <Text style={styles.ratingText}>...</Text>;
  }

  if (isError || !ratingData) {
    return <Text style={styles.ratingText}>—</Text>;
  }

  const avgRating = ratingData.averageRating ?? 0;
  const count = ratingData.totalReviews ?? 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.ratingButton}>
      <Text style={styles.ratingText}>
        ⭐ {avgRating.toFixed(1)} ({count})
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ratingButton: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fbbf24', 
    fontWeight: '700',
  },
});