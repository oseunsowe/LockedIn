import { BlurView } from 'expo-blur';
import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/theme';
import { semantic, space, type } from '@/theme';

type TabButtonProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  isFocused?: boolean;
  icon: IconName;
  label: string;
};

/**
 * The child of a `<TabTrigger asChild>`. expo-router/ui clones this element via a Radix `Slot`
 * (see node_modules/expo-router/build/ui/Slot.js) and merges in `isFocused`, `onPress`, `style`,
 * and a `ref` — it does NOT call this as a render-prop function. Must accept those as plain props
 * and forward the ref, or the slot merge silently no-ops.
 */
export const TabButton = forwardRef<RNView, TabButtonProps>(function TabButton(
  { isFocused, icon, label, style, ...pressableProps },
  ref,
) {
  const color = isFocused ? semantic.text.primary : semantic.text.tertiary;
  return (
    <Pressable ref={ref} style={[styles.tabButton, style]} {...pressableProps}>
      <Icon name={icon} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {isFocused ? <View style={styles.activeDot} /> : null}
    </Pressable>
  );
});

export function TabBarBackground({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <BlurView
      intensity={40}
      tint="dark"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
    backgroundColor: 'rgba(15,15,30,0.72)', // semantic.bg.surface at ~72% — BlurView needs a translucent, not opaque, fill
    paddingTop: space.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: space.xs,
  },
  label: {
    ...type.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.action.primary,
  },
});
