import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const AttachmentPreview = ({ attachment, onRemove }) => {
  if (!attachment) return null;

  const isImage = attachment.type?.startsWith('image/');

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        {isImage ? (
          <Image source={{ uri: attachment.uri }} style={styles.image} />
        ) : (
          <View style={styles.filePreview}>
            <Text style={styles.fileIcon}>📄</Text>
            <Text style={styles.fileName} numberOfLines={1}>
              {attachment.name}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Text style={styles.removeIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  preview: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AttachmentPreview;