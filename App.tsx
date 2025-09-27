import React, { useState } from 'react';
import { View, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

import CameraScreen from './src/screens/CameraScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BottomTabBar from './src/components/BottomTabBar';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Camera');
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterScreen onBackToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginScreen onShowRegister={() => setShowRegister(true)} />
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Camera':
        return <CameraScreen />;
      case 'Feed':
        return <FeedScreen />;
      case 'Friends':
        return <FriendsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <CameraScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
