export const Theme = {
  colors: {
    // Premium theme tailored for to-be-mothers (calming amethysts, rose tones, serenity teals)
    primary: '#7C4A80',         // Warm Amethyst/Orchid - comforting and premium
    primaryLight: '#F5ECF6',    // Delicate lavender background
    primaryDark: '#56315A',     // Deep Plum for text emphasis
    accent: '#479B92',          // Serene Teal - medical reassurance, fresh
    accentLight: '#E8F6F4',     // Light teal highlights
    
    // Core Layout
    background: '#FAFAFD',      // Soft off-white to reduce eye strain
    cardBackground: '#FFFFFF',  // Crisp card containers
    divider: '#EBEBF2',         // Subtle separators
    
    // Semantic Colors
    success: '#3FB178',         // Gentle Emerald
    warning: '#E29C35',         // Soft Gold
    danger: '#D65454',          // Warm Terracotta Red (for high intensity contraction indicators)
    info: '#4B92D4',            // Serene Sky Blue
    
    // Neutral Text Tone
    text: '#1C192E',            // Charcoal Blue - highly readable, professional
    textSecondary: '#6B6978',   // Medium Slate Grey
    textMuted: '#9B9AA8',       // Light Dust Grey
    textOnPrimary: '#FFFFFF',   // Bright contrast text
  },
  
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      xxl: 32,
      jumbo: 48,
    },
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeights: {
      tight: 18,
      normal: 22,
      relaxed: 26,
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  
  borders: {
    radius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      round: 9999,
    },
    width: {
      thin: 1,
      medium: 2,
      thick: 3,
    }
  },

  shadows: {
    // Glassmorphic / clean floating shadow offsets
    light: {
      shadowColor: '#1A0C22',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1A0C22',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    heavy: {
      shadowColor: '#1A0C22',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    }
  }
};

export type ITheme = typeof Theme;
export default Theme;
