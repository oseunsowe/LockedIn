import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/state/auth';

/**
 * Top-right avatar that opens Profile & settings (UI v2 navigation: Profile is no longer a tab).
 * 44pt touch target around the picture.
 */
export function ProfileButton({ size = 40 }: { size?: number }) {
  const { profile } = useAuth();
  return (
    <Pressable
      onPress={() => router.push('/(app)/profile')}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityLabel="Open profile and settings"
    >
      <Avatar uri={profile?.avatar_url} name={profile?.display_name} size={size} />
    </Pressable>
  );
}
