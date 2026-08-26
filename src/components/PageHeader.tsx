import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useThemeColors } from '../lib/ThemeContext';
import { useResponsiveLayout } from '../lib/layout';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const colors = useThemeColors();
  const { isWeb, isMobile } = useResponsiveLayout();

  if (isWeb) {
    return (
      <View style={styles.webHeader}>
        <Text style={[styles.webTitle, { color: colors.textPrimary }, !isMobile && styles.webTitleLarge]}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.nativeHeader}>
      <View style={styles.nativeRow}>
        <View style={styles.nativeBrand}>
          <Image source={require('../../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
          <Text style={[styles.brandNameSmall, { color: colors.textTertiary }]}>LEDGR</Text>
        </View>
        <Text style={[styles.nativeTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {subtitle ? <Text style={[styles.nativeSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  webHeader: {
    marginBottom: 24,
  },
  webTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 24,
    lineHeight: 30,
  },
  webTitleLarge: {
    fontSize: 28,
    lineHeight: 34,
  },
  webSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 620,
  },
  nativeHeader: {
    marginBottom: 8,
  },
  nativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  nativeBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  brandNameSmall: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    letterSpacing: 2,
  },
  nativeTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  nativeSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
});
