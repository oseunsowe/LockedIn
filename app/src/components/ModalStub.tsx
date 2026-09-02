import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/theme';
import { semantic, space, type } from '@/theme';

type ModalStubProps = {
  icon: IconName;
  title: string;
  phase: string;
  description: string;
};

export function ModalStub({ icon, title, phase, description }: ModalStubProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + space.lg }]}>
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Icon name="close" size={18} color={semantic.text.secondary} />
      </Pressable>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={28} color={semantic.text.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.phase}>{phase}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  closeButton: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xxxl,
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
