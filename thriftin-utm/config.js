// config.js
// Centralize API base URL. Adjust `LAN_IP` when testing on a real device.
import { Platform } from 'react-native';

// If you're testing on Android emulator (AVD), use 10.0.2.2 to reach host localhost.
// If testing on web, use localhost. For a real physical device, replace LAN_IP
// with your computer's IP on the local network (e.g. 192.168.1.20).
const LAN_IP = '10.204.96.184'; // <-- REPLACE this with your PC LAN IP for real device testing

const API_BASE = Platform.OS === 'web'
  ? `http://localhost:3000`
  : `http://${LAN_IP}:3000`;
export default API_BASE;
