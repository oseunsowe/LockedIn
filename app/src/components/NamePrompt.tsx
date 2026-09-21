import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName';
import { firstNameOf } from '@/lib/names';
import { useAuth } from '@/state/auth';
import { radius, semantic, space, type } from '@/theme';

/** Shown on the dashboard for accounts with no `display_name` yet (everyone who signed up before
 * onboarding asked for one), so the greeting can use a real first name instead of the email. */
export function NamePrompt({ userId }: { userId: string }) {
  const { refreshProfile } = useAuth();
  const updateName = useUpdateDisplayName(userId);
  const [draft, setDraft] = useState('');
  const name = firstNameOf(draft);

  async function save() {
    if (!name) return;
    try {
      await updateName.mutateAsync(name);
      await refreshProfile();
    } catch {
      // Surfaced via updateName.isError below; the card stays so the user can retry.
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>What should we call you?</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="First name"
          placeholderTextColor={semantic.text.tertiary}
          autoCapitalize="words"
          returnKeyType="done"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => void save()}
          accessibilityLabel="Your first name"
        />
        <Pressable
          style={[styles.button, (!name || updateName.isPending) && styles.buttonDisabled]}
          disabled={!name || updateName.isPending}
          onPress={() => void save()}
          accessibilityRole="button"
          accessibilityLabel="Save name"
        >
          <Text style={styles.buttonLabel}>Save</Text>
        </Pressable>
      </View>
      {updateName.isError ? (
        <Text style={styles.error}>Couldn&rsquo;t save your name. Try again.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
  },
  title: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  input: {
    ...type.body,
    flex: 1,
    minWidth: 0,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    color: semantic.text.primary,
    backgroundColor: semantic.bg.elevated,
  },
  button: {
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  error: {
    ...type.caption,
    color: semantic.text.secondary,
  },
});
