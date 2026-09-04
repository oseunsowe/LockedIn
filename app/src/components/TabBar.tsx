import { BlurView } from 'expo-blur';
import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fireHaptic,
  Icon,
  type IconName,
  palette,
  radius,
  semantic,
  space,
  withAlpha,
} from '@/theme';

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
 *
 * Icon-only, no label for any tab, active or not. Selection is never color alone, though (TODO.md
 * §14.2: "never encode meaning in color alone") — the active icon also sits in a tinted pill, a
 * second, non-color cue. The label still exists for VoiceOver via `accessibilityLabel` below; only
 * the sighted, visual label is gone.
 */
export const TabButton = forwardRef<RNView, TabButtonProps>(function TabButton(
  { isFocused, icon, label, style, onPress, ...pressableProps },
  ref,
) {
  function handlePress(event: GestureResponderEvent) {
    if (!isFocused) fireHaptic('selectionTick');
    onPress?.(event);
  }

  return (
    <Pressable
      ref={ref}
      style={[styles.tabButton, style]}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      {...pressableProps}
    >
      <View style={[styles.iconWrap, isFocused ? styles.iconWrapActive : null]}>
        <Icon name={icon} size={22} color={isFocused ? palette.electric : semantic.text.tertiary} />
      </View>
    </Pressable>
  );
});

type TabBarBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * The child of a `<TabList asChild>`. Like `TabButton` above, expo-router/ui clones this via a
 * Slot and merges in `style` and a `ref` — must forward both or the merge silently no-ops.
 */
export const TabBarBackground = forwardRef<BlurView, TabBarBackgroundProps>(
  function TabBarBackground({ children, style }, ref) {
    const insets = useSafeAreaInsets();
    return (
      <BlurView
        ref={ref}
        intensity={50}
        tint="dark"
        style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.xs) }, style]}
      >
        {children}
      </BlurView>
    );
  },
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border.strong,
    backgroundColor: withAlpha(palette.obsidian, 0.78), // BlurView needs a translucent, not opaque, fill
    paddingTop: space.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Apple HIG minimum tap target
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: withAlpha(palette.electric, 0.16),
  },
});
