import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

const BottomTabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress }) => {
  const tabs = [
    { name: 'Camera', icon: '📷', label: 'Camera' },
    { name: 'Feed', icon: '🏠', label: 'Feed' },
    { name: 'Friends', icon: '👥', label: 'Friends' },
    { name: 'Profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[styles.tab, activeTab === tab.name && styles.activeTab]}
          onPress={() => onTabPress(tab.name)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.name && styles.activeTabIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.tabLabel, activeTab === tab.name && styles.activeTabLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    color: '#fff',
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabLabel: {
    color: '#fff',
  },
});

export default BottomTabBar;
