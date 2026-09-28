import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Icon, palette, semantic, withAlpha } from '@/theme';

type AvatarProps = {
  uri: string | null | undefined;
  /** Used for the initial when there's no picture. */
  name?: string | null;
  size?: number;
};

/** Profile picture with a graceful fallback: initial on a tinted disc, or the generic glyph. */
export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.wrap, dimension]} accessibilityIgnoresInvertColors>
      {uri ? (
        <Image source={{ uri }} style={dimension} contentFit="cover" transition={150} />
      ) : initial ? (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      ) : (
        <Icon name="profile" size={size * 0.55} color={semantic.text.secondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: withAlpha(palette.electric, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: semantic.text.primary,
    fontWeight: '700',
  },
});
