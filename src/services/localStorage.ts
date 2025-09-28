import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple ID generator for React Native
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface User {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  createdAt: Date;
  stats: {
    totalPosts: number;
    streak: number;
    friendsCount: number;
  };
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    username: string;
    avatar: string;
  };
  frontImage: string;
  backImage: string;
  caption: string;
  visibility: 'public' | 'friends' | 'private';
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  likes: string[];
  comments: Array<{
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: Date;
  }>;
  shares: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface Friend {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

export const storageService = {
  // Users
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'stats'>): Promise<User> {
    const user: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date(),
      stats: {
        totalPosts: 0,
        streak: 0,
        friendsCount: 0
      }
    };
    
    // Store user in users list
    const users = await this.getAllUsers();
    users.push(user);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    
    // Set as current user
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  async getAllUsers(): Promise<User[]> {
    const usersData = await AsyncStorage.getItem('users');
    if (usersData) {
      const users = JSON.parse(usersData);
      return users.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));
    }
    return [];
  },

  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      // Convert date string back to Date object
      return {
        ...user,
        createdAt: new Date(user.createdAt)
      };
    }
    return null;
  },

  async updateUser(updates: Partial<User>): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Also update in users list
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(user => user.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        await AsyncStorage.setItem('users', JSON.stringify(users));
      }
    }
  },

  async findUserByUsername(username: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(user => user.username === username) || null;
  },

  // Posts
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'expiresAt'>): Promise<Post> {
    const post: Post = {
      ...postData,
      id: generateId(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    const posts = await this.getAllPosts();
    posts.unshift(post);
    await AsyncStorage.setItem('posts', JSON.stringify(posts));

    // Update user stats
    const currentUser = await this.getCurrentUser();
    if (currentUser) {
      await this.updateUser({
        stats: {
          ...currentUser.stats,
          totalPosts: currentUser.stats.totalPosts + 1
        }
      });
    }

    return post;
  },

  async getAllPosts(): Promise<Post[]> {
    const postsData = await AsyncStorage.getItem('posts');
    if (postsData) {
      const posts = JSON.parse(postsData);
      // Convert date strings back to Date objects
      return posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        expiresAt: new Date(post.expiresAt),
        comments: post.comments.map((comment: any) => ({
          ...comment,
          createdAt: new Date(comment.createdAt)
        }))
      }));
    }
    return [];
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const posts = await this.getAllPosts();
    return posts.filter(post => post.authorId === userId);
  },

  async getFriendsPosts(userId: string): Promise<Post[]> {
    const posts = await this.getAllPosts();
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(friend => 
      friend.requesterId === userId ? friend.recipientId : friend.requesterId
    );
    
    // Filter to same calendar day only
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return posts.filter(post => {
      const postDate = new Date(post.createdAt);
      const isFromToday = postDate >= todayStart && postDate < todayEnd;
      const isFromUserOrFriend = post.authorId === userId || friendIds.includes(post.authorId);
      
      return isFromToday && isFromUserOrFriend;
    });
  },

  async getUserMemories(userId: string): Promise<Post[]> {
    const posts = await this.getAllPosts();
    // Return all posts by the user, regardless of expiration
    return posts.filter(post => post.authorId === userId);
  },

  async likePost(postId: string, userId: string): Promise<void> {
    const posts = await this.getAllPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex !== -1) {
      const post = posts[postIndex];
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        posts[postIndex] = post;
        await AsyncStorage.setItem('posts', JSON.stringify(posts));
      }
    }
  },

  async unlikePost(postId: string, userId: string): Promise<void> {
    const posts = await this.getAllPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex !== -1) {
      const post = posts[postIndex];
      post.likes = post.likes.filter(id => id !== userId);
      posts[postIndex] = post;
      await AsyncStorage.setItem('posts', JSON.stringify(posts));
    }
  },

  // Friends
  async sendFriendRequest(requesterId: string, recipientId: string): Promise<string> {
    const friend: Friend = {
      id: generateId(),
      requesterId,
      recipientId,
      status: 'pending',
      createdAt: new Date()
    };

    const friends = await this.getAllFriends();
    friends.push(friend);
    await AsyncStorage.setItem('friends', JSON.stringify(friends));

    return friend.id;
  },

  async getAllFriends(): Promise<Friend[]> {
    const friendsData = await AsyncStorage.getItem('friends');
    if (friendsData) {
      const friends = JSON.parse(friendsData);
      // Convert date strings back to Date objects
      return friends.map((friend: any) => ({
        ...friend,
        createdAt: new Date(friend.createdAt)
      }));
    }
    return [];
  },

  async getFriends(userId: string): Promise<Friend[]> {
    const friends = await this.getAllFriends();
    return friends.filter(friend => 
      friend.status === 'accepted' && 
      (friend.requesterId === userId || friend.recipientId === userId)
    );
  },

  async getPendingRequests(userId: string): Promise<Friend[]> {
    const friends = await this.getAllFriends();
    return friends.filter(friend => 
      friend.status === 'pending' && friend.recipientId === userId
    );
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const friends = await this.getAllFriends();
    const friendIndex = friends.findIndex(friend => friend.id === requestId);
    
    if (friendIndex !== -1) {
      friends[friendIndex].status = 'accepted';
      await AsyncStorage.setItem('friends', JSON.stringify(friends));
    }
  },

  async rejectFriendRequest(requestId: string): Promise<void> {
    const friends = await this.getAllFriends();
    const filteredFriends = friends.filter(friend => friend.id !== requestId);
    await AsyncStorage.setItem('friends', JSON.stringify(filteredFriends));
  },

  async removeFriend(friendId: string): Promise<void> {
    const friends = await this.getAllFriends();
    const filteredFriends = friends.filter(friend => friend.id !== friendId);
    await AsyncStorage.setItem('friends', JSON.stringify(filteredFriends));
  },

  // Image storage
  async uploadImage(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  },

  // Check if user has posted today
  async hasPostedToday(userId: string): Promise<boolean> {
    const posts = await this.getAllPosts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return posts.some(post => {
      if (post.authorId !== userId) return false;
      const postDate = new Date(post.createdAt);
      postDate.setHours(0, 0, 0, 0);
      return postDate.getTime() === today.getTime();
    });
  }
};
