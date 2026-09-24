// ============================================================
// src/components/ui/ScaleButton.tsx
// Bouton réutilisable avec effet "pop" / échelle (scale) au clic
// ============================================================

import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScaleButtonProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
}

export function ScaleButton({
  children,
  style,
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: ScaleButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ transform: [{ scale: scaleAnim }] }, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
