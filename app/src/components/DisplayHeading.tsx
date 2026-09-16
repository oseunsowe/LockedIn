import { StyleSheet, Text, View } from 'react-native';

import { gradients, semantic, type } from '@/theme';

type DisplayHeadingProps = {
  /** First line, rendered in primary text color. */
  line1: string;
  /** Second line, rendered with the violet -> iris -> gold gradient. */
  line2: string;
  size?: 'display' | 'displayLarge';
};

/**
 * Two-tone headline: white line 1 + gradient line 2. Appears on 6+ screens
 * ("Turn your goals / into missions.", "What are you / working toward?") — build once, reuse.
 *
 * True gradient text needs a masked SVG gradient; RN text can't render one directly without
 * extra native cost. This ships the iris tone (the gradient's midpoint) as a flat color, which
 * matches the brand board closely at body-copy sizes. Swap for a masked gradient if a later
 * design pass calls for the full sweep on the display-large hero headline.
 */
export function DisplayHeading({ line1, line2, size = 'display' }: DisplayHeadingProps) {
  const style = type[size];
  return (
    <View>
      <Text style={[styles.line, style, { color: semantic.text.primary }]}>{line1}</Text>
      <Text style={[styles.line, style, { color: gradients.headline[1] }]}>{line2}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    includeFontPadding: false,
  },
});
