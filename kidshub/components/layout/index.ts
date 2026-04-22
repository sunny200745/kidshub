/**
 * Barrel export for layout components.
 *
 * Intentionally small right now — legacy had Sidebar/Header/BottomNav but
 * Expo Router's Tabs owns the nav, so we only need a simple ScreenContainer.
 */
export { ScreenContainer } from './screen-container';
export type { ScreenContainerProps } from './screen-container';
