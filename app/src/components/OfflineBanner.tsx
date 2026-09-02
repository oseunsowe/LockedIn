import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { semantic, space, type } from '@/theme';

function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      // `isConnected === null` means "not yet known" — don't flash the banner on cold start.
      setIsOffline(state.isConnected === false);
    });
  }, []);

  return isOffline;
}

/**
 * Mounted once inside the (app) tab group — proof/verification calls need this most.
 * Absolutely positioned so it overlays content instead of pushing it down — screens compute
 * their own top inset independently (see StubScreen), so a layout-flow banner would double
 * that padding whenever it's visible.
 */
export function OfflineBanner() {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <Text style={[styles.banner, { paddingTop: insets.top + space.xs }]} pointerEvents="none">
      No connection — some actions will queue until you&rsquo;re back online
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...type.caption,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    color: semantic.text.onAccent,
    backgroundColor: semantic.state.warning,
    textAlign: 'center',
    paddingBottom: space.xs,
  },
});
