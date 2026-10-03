/**
 * Glassmorphism utilities for BELENTANI v3.0
 * Minimalista sofisticada: Negro + Blanco + Púrpura suave
 */

export const GLASS_COLORS = {
  // Base palette
  black: '#0A0A0E',
  white: '#FFFFFF',
  purpleSoft: '#8B5CF6', // Soft purple
  purpleLight: '#A78BFA', // Light purple
  purpleDark: '#6D28D9', // Dark purple

  // Glass backgrounds (semi-transparent)
  glassDark: 'rgba(10, 10, 14, 0.45)',
  glassLight: 'rgba(255, 255, 255, 0.08)',
  glassAccent: 'rgba(139, 92, 246, 0.1)', // Soft purple tint

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',

  // Borders
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  borderPurple: 'rgba(139, 92, 246, 0.2)',
};

export const GLASS_STYLES = {
  // Base glass effect
  base: {
    backgroundColor: GLASS_COLORS.glassDark,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
    borderRadius: 24,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },

  // Glass with purple accent
  accent: {
    backgroundColor: GLASS_COLORS.glassAccent,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderPurple,
    borderRadius: 24,
    boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
  },

  // Subtle glass (less blur, more transparent)
  subtle: {
    backgroundColor: 'rgba(10, 10, 14, 0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
  },

  // Floating element (more prominent)
  floating: {
    backgroundColor: GLASS_COLORS.glassDark,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: GLASS_COLORS.borderGlass,
    borderRadius: 28,
    boxShadow: '0 12px 48px 0 rgba(0, 0, 0, 0.5)',
  },
};

/**
 * Tailwind classes for glassmorphism
 * Add these to your tailwind.config.js if using Tailwind
 */
export const GLASS_TAILWIND = {
  base: 'bg-[rgba(10,10,14,0.45)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.08)] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
  accent: 'bg-[rgba(139,92,246,0.1)] backdrop-blur-[16px] border border-[rgba(139,92,246,0.2)] rounded-3xl shadow-[0_8px_32px_rgba(139,92,246,0.15)]',
  subtle: 'bg-[rgba(10,10,14,0.25)] backdrop-blur-[8px] border border-[rgba(255,255,255,0.05)] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
  floating: 'bg-[rgba(10,10,14,0.45)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.08)] rounded-[28px] shadow-[0_12px_48px_rgba(0,0,0,0.5)]',
};

/**
 * Animation utilities for glassmorphism
 */
export const GLASS_ANIMATIONS = {
  fadeIn: {
    opacity: [0, 1],
    duration: 300,
  },
  slideUp: {
    transform: ['translateY(20px)', 'translateY(0)'],
    opacity: [0, 1],
    duration: 400,
  },
  slideDown: {
    transform: ['translateY(-20px)', 'translateY(0)'],
    opacity: [0, 1],
    duration: 400,
  },
  pulse: {
    opacity: [1, 0.5, 1],
    duration: 2000,
    repeat: Infinity,
  },
};
