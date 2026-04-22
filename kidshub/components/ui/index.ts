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
