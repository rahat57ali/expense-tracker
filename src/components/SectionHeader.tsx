import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../lib/ThemeContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  left: {
    flex: 1,
  },
  right: {
    flexShrink: 0,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
