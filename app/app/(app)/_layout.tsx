import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { TabBarBackground, TabButton } from '@/components/TabBar';
import { semantic } from '@/theme';

/**
 * SDK 57's expo-router ships tabs as a headless kit (`expo-router/ui`: Tabs/TabList/TabTrigger/
 * TabSlot) rather than a React Navigation bottom-tabs wrapper — there is no `tabBarIcon` /
 * `tabBarBackground` screenOptions API anymore, and `@react-navigation/bottom-tabs` isn't even
 * in the dependency tree. Verified against the shipped .d.ts files in
 * node_modules/expo-router/build/ui/*, not assumed from memory — see AGENTS.md.
 */
export default function AppTabsLayout() {
  return (
    <Tabs style={styles.root}>
      <OfflineBanner />
      <TabSlot />
      <TabBarBackground>
        <TabList style={styles.tabList}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="home" label="Home" />
          </TabTrigger>
          <TabTrigger name="missions" href="/missions" asChild>
            <TabButton icon="missions" label="Missions" />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton icon="progress" label="Progress" />
          </TabTrigger>
          <TabTrigger name="insights" href="/insights" asChild>
            <TabButton icon="ai" label="Insights" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile" label="Profile" />
          </TabTrigger>
        </TabList>
      </TabBarBackground>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  tabList: {
    flexDirection: 'row',
  },
});
