export const colors = {
  // Backgrounds
  bg: '#0F0F14',
  surface: '#1A1A24',
  card: '#22222F',
  cardHover: '#2A2A3C',
  border: '#2A2A3A',

  // Accent
  primary: '#6C63FF',
  primaryDim: '#6C63FF33',

  // Semantic
  success: '#00D4A0',
  successDim: '#00D4A020',
  danger: '#FF4D6A',
  dangerDim: '#FF4D6A20',
  warning: '#FFB930',

  // Text
  text: '#F0F0F5',
  textSecondary: '#8888A0',
  textMuted: '#55556A',

  // Chart line
  spark: '#6C63FF',
  sparkFill: '#6C63FF18',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,

  // Font weights (React Native uses string literals)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};
