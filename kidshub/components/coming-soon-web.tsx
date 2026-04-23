/**
 * ComingSoonWeb — fullscreen splash shown in place of the app when the
 * user is on a web browser and `ENABLE_WEB_APP` is false.
 *
 * Positioning: mobile-first, get on the app store. Dashboard + landing
 * still work on web (owner → dashboard.getkidshub.com, marketing →
 * getkidshub.com); this splash is specifically for parent/teacher users
 * who typed the app URL.
 *
 * Env escape hatch: we mention the override so engineers debugging in
 * web can set EXPO_PUBLIC_ENABLE_WEB_APP=true and keep moving, but we
 * don't expose a clickable override — that would defeat the gate.
 */
import { Baby, Smartphone } from 'lucide-react-native';
import { Linking, Pressable, Text, View } from 'react-native';

const APP_STORE_URL = 'https://apps.apple.com/app/kidshub'; // TODO: real URL once published
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kidshub';
const DASHBOARD_URL = 'https://dashboard.getkidshub.com';

export function ComingSoonWeb() {
  const open = (url: string) => () => {
    Linking.openURL(url).catch(() => {
      // no-op; Linking always resolves on web, but the real URL may 404
      // until the app is listed. Fine — the CTA is still intelligible.
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 py-10 min-h-screen">
      <View className="w-16 h-16 rounded-2xl bg-brand-500 items-center justify-center mb-5 shadow-sm">
        <Baby size={32} color="#ffffff" />
      </View>

      <Text className="text-3xl font-extrabold text-surface-900 text-center">
        KidsHub — for families & teachers
      </Text>
      <Text className="text-base text-surface-500 text-center mt-3 max-w-md">
        KidsHub for parents and teachers is a mobile app. Grab it on iOS
        or Android to check in children, message teachers, and see today&apos;s
        activities.
      </Text>

      <View className="flex-row flex-wrap gap-3 mt-6 justify-center">
        <Pressable
          accessibilityRole="button"
          onPress={open(APP_STORE_URL)}
          className="rounded-xl bg-surface-900 px-5 py-3 flex-row items-center gap-2 active:opacity-80">
          <Smartphone size={18} color="#ffffff" />
          <Text className="text-white font-semibold">Download on iOS</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={open(PLAY_STORE_URL)}
          className="rounded-xl bg-surface-900 px-5 py-3 flex-row items-center gap-2 active:opacity-80">
          <Smartphone size={18} color="#ffffff" />
          <Text className="text-white font-semibold">Get it on Android</Text>
        </Pressable>
      </View>

      <View className="mt-10 border-t border-surface-100 pt-6 max-w-md w-full items-center">
        <Text className="text-sm text-surface-500 text-center">
          Are you a daycare owner? Head to the owner dashboard on the web.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={open(DASHBOARD_URL)}
          className="mt-3 active:opacity-70">
          <Text className="text-brand-600 font-semibold text-sm">
            Open dashboard.getkidshub.com →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
