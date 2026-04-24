/**
 * Barrel export for KidsHub UI primitives — the RN equivalents of the legacy
 * web primitives in kidshub-legacy/src/components/ui/.
 *
 * Consumer imports look like:
 *
 *   import { Card, CardBody, Avatar, Badge } from '@/components/ui';
 *
 * which matches the legacy import site patterns 1:1 and makes the port
 * mechanical — often just swapping the source path.
 */
export { Card, CardBody, CardHeader } from './card';
export type { CardBodyProps, CardHeaderProps, CardProps } from './card';
export { Avatar } from './avatar';
export type { AvatarProps, AvatarSize } from './avatar';
export { Badge } from './badge';
export type { BadgeProps, BadgeVariant } from './badge';
export { RoleBadge } from './role-badge';
export type { RoleBadgeProps } from './role-badge';
export { LoadingState, EmptyState } from './loading-state';
export type { LoadingStateProps, EmptyStateProps } from './loading-state';

// Sprint 2 primitives (B5 visual system pass). Keep below legacy exports
// so the diff is small and the legacy barrel order is undisturbed.
export { Pill } from './pill';
export type { PillProps, PillTone, PillVariant, PillSize } from './pill';
export { ActionButton } from './action-button';
export type {
  ActionButtonProps,
  ActionButtonVariant,
  ActionButtonTone,
  ActionButtonSize,
} from './action-button';
export { EntityCard } from './entity-card';
export type { EntityCardProps } from './entity-card';
export { SheetModal } from './sheet-modal';
export type { SheetModalProps } from './sheet-modal';
export { TierBadge } from './tier-badge';
export type { TierBadgeProps } from './tier-badge';
