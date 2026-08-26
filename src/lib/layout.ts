import { Platform, useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const pagePadding = isMobile ? 16 : isTablet ? 24 : 32;
  const contentMaxWidth = isDesktop ? 1440 : isTablet ? 1100 : 720;
  const sectionGap = isMobile ? 16 : 24;
  const sidebarWidth = isDesktop ? 280 : isTablet ? 88 : 76;
  const modalWidth = isMobile ? Math.min(width - 24, 520) : Math.min(width - 48, 720);

  return {
    width,
    height,
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    pagePadding,
    contentMaxWidth,
    sectionGap,
    sidebarWidth,
    modalWidth,
  };
}
