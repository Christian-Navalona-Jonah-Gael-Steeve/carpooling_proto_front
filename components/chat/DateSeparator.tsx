import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMessageDateLabel } from '@/lib/utils/date.utils';

interface DateSeparatorProps {
  dateString: string;
}

/**
 * DateSeparator Component
 *
 * Displays a centered date separator between messages from different days.
 * Shows "Aujourd'hui", "Hier", or DD/MM/YYYY format.
 */
export const DateSeparator: React.FC<DateSeparatorProps> = ({ dateString }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.dateText}>{getMessageDateLabel(dateString)}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
});
