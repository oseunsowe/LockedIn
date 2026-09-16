import { Stack } from 'expo-router';

import { semantic } from '@/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: { backgroundColor: semantic.bg.canvas },
      }}
    />
  );
}
