/**
 * SheetModal — bottom-sheet primitive shared by every kidshub flow that
 * needs a "swipe-up" form (check-in, quick-log, child actions, reply
 * composer…). Before this existed, each screen re-implemented the same
 * `Modal + dimmer + KeyboardAvoidingView + rounded container` pattern,
 * differing in subtle ways. Centralizing it here locks down:
 *
 *   - tap-outside-to-dismiss (honours `dismissible`)
 *   - keyboard-aware layout on iOS (padding behavior)
 *   - grab handle + consistent radius + max-height guardrail
 *   - safe-area-respecting bottom padding
 *
 * The visual language is intentionally Lillio-adjacent: rounded-3xl top
 * corners, small grab handle, generous 24pt inner padding. Anything
 * busier defeats the point of a sheet.
 */
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

export type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Optional title rendered in a small header under the grab handle. */
  title?: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** If false, tapping the backdrop does nothing (use when a write is in flight). */
  dismissible?: boolean;
  /**
   * Max sheet height as a CSS-ish percentage string. Default 85% leaves
   * a glimpse of the dimmer so users never feel trapped.
   */
  maxHeight?: string;
  children: ReactNode;
};

export function SheetModal({
  visible,
  onClose,
  title,
  subtitle,
  dismissible = true,
  maxHeight = '88%',
  children,
}: SheetModalProps) {
  const handleBackdropPress = () => {
    if (dismissible) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissible ? onClose : () => undefined}>
      <Pressable className="flex-1 bg-black/40" onPress={handleBackdropPress} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        <View
          className="bg-white dark:bg-surface-900 rounded-t-3xl px-6 pt-3 pb-8"
          style={{ maxHeight: maxHeight as unknown as number }}>
          {/* Grab handle — decorative, centered. Signals "draggable" even
              though the Modal itself doesn't support a drag gesture. */}
          <View className="w-10 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full self-center mb-4" />

          {title ? (
            <View className="mb-4">
              <Text className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {title}
              </Text>
              {subtitle ? (
                <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}

          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
