import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
    { id: 'add', icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Add' },
    { id: 'myproducts', icon: 'cube-outline', activeIcon: 'cube', label: 'My Items' },
    { id: 'chats', icon: 'chatbubble-outline', activeIcon: 'chatbubble', label: 'Chats' },
    { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={styles.navItem}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={24}
              color={isActive ? '#A30F0F' : '#6b7280'}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 5,
    paddingTop: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#6b7280',
  },
  navLabelActive: {
    color: '#A30F0F',
    fontWeight: '600',
  },
});
