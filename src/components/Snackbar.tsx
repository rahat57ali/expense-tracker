import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Animated, Text, StyleSheet, View, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('success');
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(20));

  const showSnackbar = useCallback((msg: string, t: SnackbarType = 'success') => {
    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      hideSnackbar();
    }, 3000);
  }, [opacity, translateY]);

  const hideSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.container, 
            { opacity, transform: [{ translateY }] },
            type === 'success' ? styles.success : type === 'error' ? styles.error : styles.info
          ]}
        >
          <View style={styles.content}>
            {type === 'success' && <CheckCircle size={18} color="#0A0A0A" />}
            {type === 'error' && <AlertCircle size={18} color="#FFFFFF" />}
            {type === 'info' && <Info size={18} color="#FFFFFF" />}
            <Text style={[styles.text, type === 'success' ? styles.textDark : styles.textLight]}>
              {message}
            </Text>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider');
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  success: {
    backgroundColor: '#00F0FF',
  },
  error: {
    backgroundColor: '#EF4444',
  },
  info: {
    backgroundColor: '#3B82F6',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    flex: 1,
  },
  textDark: {
    color: '#0A0A0A',
  },
  textLight: {
    color: '#FFFFFF',
  },
});
