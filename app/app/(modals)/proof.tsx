import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMission } from '@/hooks/useMission';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import type { ProofType } from '@/lib/database.types';
import type { PickedAsset } from '@/lib/proofUpload';
import { useAuth } from '@/state/auth';
import { Icon, type IconName, palette, radius, semantic, space, type, withAlpha } from '@/theme';

type ProofOption = {
  type: ProofType;
  icon: IconName;
  label: string;
  description: string;
  disabled?: boolean;
};

const options: ProofOption[] = [
  {
    type: 'photo',
    icon: 'camera',
    label: 'Camera',
    description: 'Take a photo showing you did it',
  },
  {
    type: 'screenshot',
    icon: 'screenshot',
    label: 'Screenshot',
    description: 'Attach a screenshot from your phone',
  },
  {
    type: 'voice',
    icon: 'voice',
    label: 'Voice Recording',
    description: 'Record a 20 second explanation',
    disabled: true,
  },
  { type: 'file', icon: 'file', label: 'Upload File', description: 'Attach a file as evidence' },
];

/**
 * Proof submission (TODO.md §8.2, `LockedIn.md` Screen 11). Camera and Screenshot both go through
 * `expo-image-picker` — its `launchCameraAsync` opens the OS's native camera UI rather than an
 * embedded live camera view, which (unlike the separate `expo-camera` module) works reliably in
 * Expo Go and doesn't need a dev client build (see TODO.md §0.5's "Expo Go cannot host
 * expo-camera/expo-audio reliably" finding). Voice is disabled for the same reason in reverse —
 * recording genuinely needs `expo-audio`, which isn't added here to avoid that exact risk on a
 * device that's only running Expo Go right now.
 */
export default function ProofModal() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const missionQuery = useMission(missionId);
  const submitProof = useSubmitProof(session?.user.id);

  const [selectedType, setSelectedType] = useState<ProofType | null>(null);
  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  async function pickCamera() {
    setPickError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPickError('Camera access is needed to take a proof photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    setSelectedType('photo');
    setAsset({
      uri: picked.uri,
      mimeType: picked.mimeType,
      width: picked.width,
      height: picked.height,
    });
  }

  async function pickScreenshot() {
    setPickError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickError('Photo library access is needed to attach a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    setSelectedType('screenshot');
    setAsset({
      uri: picked.uri,
      mimeType: picked.mimeType,
      width: picked.width,
      height: picked.height,
    });
  }

  async function pickFile() {
    setPickError(null);
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const picked = result.assets[0];
    setSelectedType('file');
    setAsset({ uri: picked.uri, mimeType: picked.mimeType, name: picked.name });
  }

  function selectOption(optionType: ProofType) {
    if (optionType === 'photo') void pickCamera();
    else if (optionType === 'screenshot') void pickScreenshot();
    else if (optionType === 'file') void pickFile();
  }

  async function handleSubmit() {
    if (!missionId || !selectedType || !asset) return;
    try {
      const proof = await submitProof.mutateAsync({ missionId, proofType: selectedType, asset });
      router.replace({ pathname: '/(modals)/verification', params: { proofId: proof.id } });
    } catch {
      // submitProof.isError renders the inline error banner below.
    }
  }

  const canSubmit = !!selectedType && !!asset && !submitProof.isPending;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.closeButton, { top: insets.top + space.sm }]}
        onPress={() => router.back()}
      >
        <Icon name="close" size={18} color={semantic.text.secondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xxl, paddingBottom: space.xl },
        ]}
      >
        <Text style={styles.title}>Submit Proof</Text>
        <Text style={styles.subtitle}>
          {missionQuery.data ? `For "${missionQuery.data.title}"` : 'Show your work.'}
        </Text>

        <View style={styles.optionList}>
          {options.map((option) => {
            const selected = selectedType === option.type;
            return (
              <Pressable
                key={option.type}
                style={[
                  styles.optionCard,
                  selected ? styles.optionCardSelected : null,
                  option.disabled ? styles.optionCardDisabled : null,
                ]}
                disabled={option.disabled}
                onPress={() => selectOption(option.type)}
              >
                <View
                  style={[
                    styles.optionIcon,
                    selected ? { backgroundColor: withAlpha(palette.electric, 0.16) } : null,
                  ]}
                >
                  <Icon
                    name={option.icon}
                    size={20}
                    color={selected ? palette.electric : semantic.text.secondary}
                  />
                </View>
                <View style={styles.optionBody}>
                  <View style={styles.optionLabelRow}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.disabled ? <Text style={styles.soonBadge}>SOON</Text> : null}
                  </View>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {pickError ? <Text style={styles.errorText}>{pickError}</Text> : null}

        {asset && selectedType ? (
          <View style={styles.previewCard}>
            {selectedType === 'file' ? (
              <View style={styles.filePreview}>
                <Icon name="file" size={20} color={semantic.text.secondary} />
                <Text style={styles.fileName} numberOfLines={1}>
                  {asset.name ?? 'Selected file'}
                </Text>
              </View>
            ) : (
              <Image source={{ uri: asset.uri }} style={styles.imagePreview} contentFit="cover" />
            )}
          </View>
        ) : null}

        {submitProof.isError ? (
          <Text style={styles.errorText}>
            Couldn&rsquo;t submit that proof
            {submitProof.error instanceof Error ? `: ${submitProof.error.message}` : '.'} Try again.
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          style={[styles.cta, !canSubmit ? styles.ctaDisabled : null]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitProof.isPending ? (
            <ActivityIndicator color={semantic.text.onAccent} />
          ) : (
            <Text style={canSubmit ? styles.ctaLabel : styles.ctaLabelDisabled}>
              {asset ? 'Submit Proof' : 'Choose a proof type above'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  closeButton: {
    position: 'absolute',
    right: space.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.xl,
    gap: space.lg,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
  },
  optionList: {
    gap: space.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.md,
  },
  optionCardSelected: {
    borderColor: palette.electric,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.icon,
    backgroundColor: semantic.glass.fill8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  optionLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  soonBadge: {
    ...type.data,
    fontSize: 9,
    color: palette.iris,
  },
  optionDescription: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  previewCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  imagePreview: {
    width: '100%',
    height: 220,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
  },
  fileName: {
    ...type.bodyMedium,
    color: semantic.text.primary,
    flex: 1,
  },
  errorText: {
    ...type.caption,
    color: semantic.state.danger,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  ctaDisabled: {
    backgroundColor: semantic.bg.surface,
  },
  ctaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  ctaLabelDisabled: {
    ...type.bodyMedium,
    color: semantic.text.tertiary,
  },
});
