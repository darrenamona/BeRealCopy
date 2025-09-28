import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { storageService, Friend } from '../services/localStorage';

const FriendsScreen: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [userInfoCache, setUserInfoCache] = useState<{[key: string]: any}>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = friends.filter(friend =>
        friend.requesterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.recipientId.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user) {
        const friendsList = await storageService.getFriends(user.id);
        const requestsList = await storageService.getPendingRequests(user.id);
        setFriends(friendsList);
        setPendingRequests(requestsList);
        
        // Load user info for all friends and requests
        await loadUserInfo([...friendsList, ...requestsList]);
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async (friendsList: Friend[]) => {
    const userIds = new Set<string>();
    friendsList.forEach(friend => {
      userIds.add(friend.requesterId);
      userIds.add(friend.recipientId);
    });

    const cache: {[key: string]: any} = {};
    for (const userId of userIds) {
      if (!userInfoCache[userId]) {
        try {
          const allUsers = await storageService.getAllUsers();
          const userInfo = allUsers.find(u => u.id === userId);
          if (userInfo) {
            cache[userId] = userInfo;
          }
        } catch (error) {
          console.error('Error loading user info for:', userId, error);
        }
      } else {
        cache[userId] = userInfoCache[userId];
      }
    }
    
    setUserInfoCache(prev => ({ ...prev, ...cache }));
  };

  const getUserInfo = (userId: string) => {
    return userInfoCache[userId] || { username: userId, avatar: null };
  };

  const addFriend = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!user) return;

    // Check if trying to add self
    if (searchQuery.toLowerCase() === user.username.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    try {
      // Check if user exists
      const targetUser = await storageService.findUserByUsername(searchQuery);
      if (!targetUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Check if already friends or request already sent
      const existingFriends = await storageService.getAllFriends();
      const existingRequest = existingFriends.find(friend => 
        (friend.requesterId === user.id && friend.recipientId === targetUser.id) ||
        (friend.requesterId === targetUser.id && friend.recipientId === user.id)
      );

      if (existingRequest) {
        if (existingRequest.status === 'accepted') {
          Alert.alert('Error', 'You are already friends with this user');
        } else if (existingRequest.status === 'pending') {
          Alert.alert('Error', 'Friend request already sent');
        }
        return;
      }

      await storageService.sendFriendRequest(user.id, targetUser.id);
      
      Alert.alert('Success', `Friend request sent to ${searchQuery}!`);
      setSearchQuery('');
      loadData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await storageService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      loadData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await storageService.rejectFriendRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await storageService.removeFriend(friendId);
      Alert.alert('Success', 'Friend removed');
      loadData();
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const otherUserId = item.requesterId === user?.id ? item.recipientId : item.requesterId;
    const otherUser = getUserInfo(otherUserId);
    
    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          <View style={styles.avatar}>
            {otherUser.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {otherUser.username[0].toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.friendName}>{otherUser.username}</Text>
            <Text style={styles.friendStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFriend(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: Friend }) => {
    const requesterUser = getUserInfo(item.requesterId);
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.friendInfo}>
          <View style={styles.avatar}>
            {requesterUser.avatar ? (
              <Image source={{ uri: requesterUser.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {requesterUser.username[0].toUpperCase()}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.friendName}>{requesterUser.username}</Text>
            <Text style={styles.requestTime}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => acceptFriendRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => rejectFriendRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search or add friends..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={addFriend}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'friends' ? filteredFriends : pendingRequests}
        renderItem={activeTab === 'friends' ? renderFriendItem : renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeTab === 'friends' 
                ? 'No friends yet. Add some friends to get started!'
                : 'No pending requests'
              }
            </Text>
          </View>
        )}
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendStatus: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 2,
  },
  requestTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
    paddingVertical: 50,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FriendsScreen;