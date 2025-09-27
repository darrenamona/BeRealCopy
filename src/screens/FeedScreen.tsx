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
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { storageService, Post } from '../services/localStorage';

const { width, height } = Dimensions.get('window');

interface FeedItemProps {
  post: Post;
  onImagePress: (image: string) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ post, onImagePress }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [author, setAuthor] = useState<any>(null);

  useEffect(() => {
    // Check if current user has liked this post
    const userLiked = post.likes.includes(user?.id || '');
    setIsLiked(userLiked);
  }, [post.likes, user?.id]);

  useEffect(() => {
    const loadAuthor = async () => {
      try {
        // First try to find by username (in case authorId is actually a username)
        let authorData = await storageService.findUserByUsername(post.authorId);
        
        // If not found by username, try to find by ID
        if (!authorData) {
          const allUsers = await storageService.getAllUsers();
          authorData = allUsers.find(user => user.id === post.authorId) || null;
        }
        
        setAuthor(authorData);
      } catch (error) {
        console.error('Error loading author:', error);
      }
    };
    loadAuthor();
  }, [post.authorId]);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await storageService.unlikePost(post.id, user?.id || '');
        setLikeCount(prev => prev - 1);
      } else {
        await storageService.likePost(post.id, user?.id || '');
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };


  return (
    <View style={styles.feedItem}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {author?.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {author?.username ? author.username[0].toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.username}>
              {author?.username || post.authorId}
            </Text>
            <Text style={styles.timestamp}>
              {formatTime(post.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.dualImageContainer}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.frontImage)}
        >
          <Image source={{ uri: post.frontImage }} style={styles.postImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Front</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.backImage)}
        >
          <Image source={{ uri: post.backImage }} style={styles.postImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionCount}>{likeCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [user]);


  const loadPosts = async () => {
    try {
      setLoading(true);
      if (user) {
        const friendsPosts = await storageService.getFriendsPosts(user.id);
        setPosts(friendsPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    // For now, just show an alert
    Alert.alert('Image', 'Image viewer not implemented yet');
  };

  const renderFeedItem = ({ item }: { item: Post }) => (
    <FeedItem post={item} onImagePress={handleImagePress} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No posts yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Take your first BeReal to get started!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BeReal</Text>
        <TouchableOpacity style={styles.headerButton} onPress={loadPosts}>
          <Text style={styles.headerButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
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
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  feedList: {
    paddingBottom: 20,
  },
  feedItem: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  moreButton: {
    padding: 5,
  },
  moreButtonText: {
    color: '#fff',
    fontSize: 20,
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
  postImage: {
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
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  actionButton: {
    marginRight: 20,
    padding: 5,
  },
  actionText: {
    fontSize: 20,
  },
  actionCount: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  likedText: {
    color: '#ff6b6b',
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

export default FeedScreen;