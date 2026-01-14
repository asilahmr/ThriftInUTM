import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const RatingStars = ({ rating, onRatingChange, size = 'medium', readonly = false }) => {
  const sizes = {
    small: 24,
    medium: 32,
    large: 48,
  };

  const starSize = sizes[size];

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onRatingChange && onRatingChange(star)}
          disabled={readonly}
          style={styles.starButton}
        >
          <Text style={[styles.star, { fontSize: starSize }]}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  star: {
    textAlign: 'center',
  },
});

export default RatingStars;