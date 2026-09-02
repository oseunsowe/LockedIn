import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/theme';
import { semantic, space, type } from '@/theme';

type StubScreenProps = {
  icon: IconName;
  title: string;
  phase: string;
  description: string;
  /** Extra real content below the description — e.g. a working sign-out button. */
  children?: React.ReactNode;
};

/**
 * Placeholder for a route that exists (proves navigation, safe areas, and the tab bar work)
 * but has no real screen built yet. NOT a Phase 6+ screen — swap out entirely when that phase lands.
 */
export function StubScreen({ icon, title, phase, description, children }: StubScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}
    >
      <View style={styles.iconWrap}>
        <Icon name={icon} size={32} color={semantic.text.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    ...type.title,
    color: semantic.text.primary,
    marginBottom: space.xs,
  },
  phase: {
    ...type.data,
    color: semantic.action.primary,
    marginBottom: space.md,
  },
  description: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
});
