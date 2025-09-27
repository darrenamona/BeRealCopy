import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { storageService, Post } from '../services/localStorage';

const { width, height } = Dimensions.get('window');

interface MemoryItemProps {
  post: Post;
  onImagePress: (image: string) => void;
}

const MemoryItem: React.FC<MemoryItemProps> = ({ post, onImagePress }) => {
  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (timestamp: Date) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > 24;
  };

  return (
    <View style={styles.memoryItem}>
      <View style={styles.memoryHeader}>
        <Text style={styles.memoryDate}>{formatDate(post.createdAt)}</Text>
        <Text style={styles.memoryTime}>{formatTime(post.createdAt)}</Text>
        {isExpired(post.createdAt) && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
      </View>
      
      <View style={styles.dualImageContainer}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.frontImage)}
        >
          <Image source={{ uri: post.frontImage }} style={styles.memoryImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Front</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.backImage)}
        >
          <Image source={{ uri: post.backImage }} style={styles.memoryImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {post.caption && (
        <Text style={styles.memoryCaption}>{post.caption}</Text>
      )}
    </View>
  );
};

const MemoriesScreen: React.FC = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any>(null);

  useEffect(() => {
    loadMemories();
    loadAuthor();
  }, []);

  const loadAuthor = async () => {
    if (user) {
      setAuthor(user);
    }
  };

  const loadMemories = async () => {
    try {
      setLoading(true);
      if (user) {
        const userMemories = await storageService.getUserMemories(user.id);
        // Sort by creation date, newest first
        const sortedMemories = userMemories.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMemories(sortedMemories);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (imageUri: string) => {
    Alert.alert('Memory', 'Image viewer not implemented yet');
  };

  const renderMemoryItem = ({ item }: { item: Post }) => (
    <MemoryItem post={item} onImagePress={handleImagePress} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading memories...</Text>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No memories yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Take your first BeReal to start creating memories!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            {author?.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={styles.headerAvatarText}>
                {author?.username ? author.username[0].toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.headerTitle}>Memories</Text>
            <Text style={styles.headerSubtitle}>{author?.username || 'Loading...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMemories}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={memories}
        renderItem={renderMemoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.memoriesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  refreshButton: {
    padding: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  memoriesList: {
    paddingBottom: 20,
  },
  memoryItem: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  memoryDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memoryTime: {
    color: '#888',
    fontSize: 14,
  },
  expiredBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dualImageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 5,
    position: 'relative',
  },
  memoryImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memoryCaption: {
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 15,
    paddingBottom: 15,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: height * 0.2,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MemoriesScreen;
