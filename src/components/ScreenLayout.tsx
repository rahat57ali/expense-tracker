import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ScreenLayoutProps {
  maxWidth: number;
  children: React.ReactNode;
  style?: any;
}

export default function ScreenLayout({ maxWidth, children, style }: ScreenLayoutProps) {
  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
});
