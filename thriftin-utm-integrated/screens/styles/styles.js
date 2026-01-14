// styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // General container kept for small screens or centered content
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Role selection layout (non-centered top layout)
  roleContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
    alignItems: 'center',
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#c70000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#800000',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#c70000',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
  },
  footerText: {
    color: '#800000',
  },

  // Header used for top colored bar (if needed elsewhere)
  headerContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#c70000',
    alignItems: 'center',
  },

  // Generic header text (kept for compatibility)
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Dashboard-specific header (title)
  dashboardHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginVertical: 16,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentText: {
    fontSize: 18,
    textAlign: 'center',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#c70000',
  },
  navText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Dashboard styles
  dashboardContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  centerCard: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 10,
  },
  topProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  productName: {
    fontSize: 16,
    color: '#000',
  },
  productSales: {
    fontSize: 16,
    color: '#555',
  },
  trendChart: {
    marginVertical: 10,
    borderRadius: 16,
  },
});