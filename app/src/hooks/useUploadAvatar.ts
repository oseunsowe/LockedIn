import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type AvatarSource = 'library' | 'camera';

/** Square crop, long edge capped — avatars render at <= 160pt, so 512px is plenty and keeps the
 * upload small (the bucket also caps files at 2 MB). */
const AVATAR_SIZE = 512;

/**
 * Picks (or captures) a picture, crops it square, compresses it, uploads it to the public
 * `avatars` bucket at `{userId}/avatar.jpg` (overwriting the previous one), and stores the public
 * URL on `profiles.avatar_url`. Resolves to `null` if the user cancels or denies permission.
 * Callers should follow success with `useAuth().refreshProfile()`.
 */
export function useUploadAvatar(userId: string | undefined) {
  return useMutation({
    mutationFn: async (source: AvatarSource) => {
      if (!userId) throw new Error('You must be signed in to change your picture.');

      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return null;

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      const resized = await ImageManipulator.manipulateAsync(
        asset.uri,
        asset.width > AVATAR_SIZE ? [{ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } }] : [],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const path = `${userId}/avatar.jpg`;
      // Raw bytes, not a Blob: React Native tags a fetched file's Blob as `text/plain`, which the
      // bucket's image-only mime allowlist rejects. An ArrayBuffer carries no type of its own, so
      // the explicit `contentType` below is what the server sees.
      const bytes = await (await fetch(resized.uri)).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Same path every time, so the CDN/image cache would keep serving the old picture — the
      // version query string forces a fresh fetch after each change.
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);
      if (updateError) throw updateError;
      return url;
    },
  });
}

export function useRemoveAvatar(userId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('You must be signed in to change your picture.');
      await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
      if (error) throw error;
    },
  });
}
