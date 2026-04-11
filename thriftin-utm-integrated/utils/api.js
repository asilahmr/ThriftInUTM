import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../config";

console.log("🚀 utils/api.js loaded");
console.log("🔧 Base URL:", config?.baseURL);

// ✅ FIXED: Remove /api from baseURL since routes already include it
const api = axios.create({
  baseURL: config?.baseURL || "https://thriftinutm-production.up.railway.app", // No /api here
  timeout: 180000,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem("token");

      if (!token) {
        token = await AsyncStorage.getItem("userToken");

        if (token) {
          console.log("🔄 Migrating old userToken to token...");
          await AsyncStorage.setItem("token", token);
          await AsyncStorage.removeItem("userToken");

          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            await AsyncStorage.setItem("user", userData);
            await AsyncStorage.removeItem("userData");
          }
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("✅ Token added:", token.substring(0, 20) + "...");
      } else {
        console.log("⚠️ No token found in storage");
      }

      console.log("📤 Request:", config.method?.toUpperCase(), config.url);
      console.log("🔗 Full URL:", config.baseURL + config.url);
    } catch (error) {
      console.error("❌ Error in request interceptor:", error);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error(
      "❌ Response error:",
      error.config?.url,
      error.response?.status,
    );

    if (error.response?.status === 401) {
      // Token invalid or expired - clear all token formats
      console.log("🔒 401 Unauthorized - clearing all tokens");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  },
);

export default api;
