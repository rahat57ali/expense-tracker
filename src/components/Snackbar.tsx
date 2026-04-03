import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Animated, Text, StyleSheet, View, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import { useThemeColors } from '../lib/ThemeContext';

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
  const colors = useThemeColors();

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

    // Store timeout to clear if needed
    const timer = setTimeout(() => {
      setVisible(false);
      opacity.setValue(0);
      translateY.setValue(20);
    }, 3000);

    return () => clearTimeout(timer);
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
            type === 'success' ? { backgroundColor: colors.accent } : 
            type === 'error' ? { backgroundColor: colors.danger } : 
            { backgroundColor: colors.blue }
          ]}
        >
          <View style={styles.content}>
            {type === 'success' && <CheckCircle size={18} color={colors.background} />}
            {type === 'error' && <AlertCircle size={18} color="#FFFFFF" />}
            {type === 'info' && <Info size={18} color="#FFFFFF" />}
            <Text style={[
              styles.text, 
              type === 'success' ? { color: colors.background } : { color: '#FFFFFF' }
            ]}>
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
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    flex: 1,
  },
});
