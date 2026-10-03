import React from 'react';
import { View, ViewProps } from 'react-native';
import { GLASS_STYLES } from '@/lib/glass-morphism';

interface GlassCardProps extends ViewProps {
  variant?: 'base' | 'accent' | 'subtle' | 'floating';
  children: React.ReactNode;
}

/**
 * GlassCard: Glassmorphism component
 * Minimalista sofisticada with backdrop-filter blur
 */
export function GlassCard({
  variant = 'base',
  children,
  style,
  ...props
}: GlassCardProps) {
  const glassStyle = GLASS_STYLES[variant];

  return (
    <View
      style={[
        glassStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
