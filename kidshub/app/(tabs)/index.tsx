import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, useTheme } from '@/contexts';
import app from '@/firebase/config';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { preference, setPreference, effective } = useTheme();
  const { isAuthenticated, loading, role } = useAuth();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      {/* p3-5 / p3-6 / p3-8 smoke tests — removed in p3-9 when this screen is replaced */}
      <View className="bg-brand-500 p-4 rounded-xl my-2">
        <Text className="text-white font-bold text-base">
          NativeWind smoke test — if this card is pink with bold white text, p3-8 is wired correctly.
        </Text>
      </View>
      <View className="bg-success-500 p-4 rounded-xl my-2">
        <Text className="text-white font-bold text-base">
          Firebase project: {app.options.projectId ?? '(not loaded — check .env)'}
        </Text>
        <Text className="text-white text-xs opacity-90 mt-1">
          If this shows kidhub-7a207, EXPO_PUBLIC_FIREBASE_* env vars loaded correctly (p3-5 ✓).
        </Text>
      </View>
      <View className="bg-accent-600 p-4 rounded-xl my-2">
        <Text className="text-white font-bold text-base">
          AuthContext: {loading ? 'loading…' : isAuthenticated ? `signed in (role: ${role ?? 'none'})` : 'signed out'}
        </Text>
        <Text className="text-white text-xs opacity-90 mt-1">
          p3-6 ✓ if this card rendered without throwing &quot;useAuth must be used within an AuthProvider&quot;.
        </Text>
      </View>
      <View className="bg-info-600 p-4 rounded-xl my-2">
        <Text className="text-white font-bold text-base">
          ThemeContext: preference=&quot;{preference}&quot; → effective=&quot;{effective}&quot;
        </Text>
        <View className="flex-row gap-2 mt-2">
          {(['system', 'light', 'dark'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPreference(p)}
              className={`px-3 py-1 rounded-full ${preference === p ? 'bg-white' : 'bg-info-800'}`}>
              <Text className={`text-xs font-semibold ${preference === p ? 'text-info-700' : 'text-white'}`}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
