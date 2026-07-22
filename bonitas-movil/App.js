import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/components/LoginScreen';
import AdminDashboard from './src/components/AdminDashboard';
import { DEFAULT_API_URL } from './src/services/api';
import { COLORS } from './src/styles/theme';

export default function App() {
  const [user, setUser] = useState(null);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [initializing, setInitializing] = useState(true);

  // Cargar estado guardado en almacenamiento local
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('bonitas_api_url');
        if (storedUrl) {
          setApiUrl(storedUrl);
        }

        const storedUser = await AsyncStorage.getItem('bonitas_admin_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.rol === 'vendedor') {
            setUser(parsedUser);
          }
        }
      } catch (e) {
        console.error('Error al cargar la sesión inicial:', e);
      } finally {
        setInitializing(false);
      }
    };

    loadSavedState();
  }, []);

  const handleLoginSuccess = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('bonitas_admin_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Error guardando usuario:', e);
    }
  };

  const handleLogout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('bonitas_admin_user');
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  const handleSaveApiUrl = async (newUrl) => {
    try {
      setApiUrl(newUrl);
      await AsyncStorage.setItem('bonitas_api_url', newUrl);
    } catch (e) {
      console.error('Error guardando la URL del API:', e);
    }
  };

  if (initializing) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.splashText}>Iniciando Bonitas Fashions Admin...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {user ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          apiUrl={apiUrl}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          currentApiUrl={apiUrl}
          onSaveApiUrl={handleSaveApiUrl}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    color: COLORS.white,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
